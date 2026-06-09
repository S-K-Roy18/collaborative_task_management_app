const Project = require('../models/Project');
const Workspace = require('../models/Workspace');
const Task = require('../models/Task');
const { AppError } = require('../middleware/errorHandler');

// @desc    Create new project inside a workspace
// @route   POST /api/project
// @access  Private
exports.createProject = async (req, res, next) => {
  try {
    const { title, description, workspaceId, status, priority, startDate, endDate, budget, members } = req.body;
    const userId = req.user._id;

    if (!title || !workspaceId) {
      return next(new AppError('Project title and workspace ID are required', 400));
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(new AppError('Workspace not found', 404));
    }

    if (!workspace.isMember(userId)) {
      return next(new AppError('Access denied: not a member of this workspace', 403));
    }

    const projectMembers = members && Array.isArray(members) ? members : [];
    // Ensure owner is added as a member
    if (!projectMembers.includes(userId.toString())) {
      projectMembers.push(userId.toString());
    }

    const project = new Project({
      title,
      description,
      workspace: workspaceId,
      status: status || 'Planning',
      priority: priority || 'medium',
      startDate,
      endDate,
      budget: budget || 0,
      members: projectMembers,
      createdBy: userId,
    });

    await project.save();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project,
    });
  } catch (error) {
    console.error('Create project error:', error);
    next(new AppError('Failed to create project', 500));
  }
};

// @desc    Get all projects in a workspace
// @route   GET /api/project/workspace/:workspaceId
// @access  Private
exports.getWorkspaceProjects = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user._id;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(new AppError('Workspace not found', 404));
    }

    if (!workspace.isMember(userId)) {
      return next(new AppError('Access denied', 403));
    }

    const projects = await Project.find({ workspace: workspaceId })
      .populate('members', 'name email avatar')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    next(new AppError('Failed to fetch projects', 500));
  }
};

// @desc    Get details of a specific project
// @route   GET /api/project/:projectId
// @access  Private
exports.getProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(projectId)
      .populate('members', 'name email avatar')
      .populate('createdBy', 'name');

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const workspace = await Workspace.findById(project.workspace);
    if (!workspace.isMember(userId)) {
      return next(new AppError('Access denied', 403));
    }

    // Get tasks associated with this project
    const tasks = await Task.find({ project: projectId }).populate('assignees', 'name email avatar');

    res.json({
      success: true,
      project,
      tasks,
    });
  } catch (error) {
    console.error('Get project error:', error);
    next(new AppError('Failed to fetch project details', 500));
  }
};

// @desc    Update project details
// @route   PUT /api/project/:projectId
// @access  Private
exports.updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const updateData = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const workspace = await Workspace.findById(project.workspace);
    if (!workspace.isMember(userId)) {
      return next(new AppError('Access denied', 403));
    }

    // Update fields
    const allowedFields = ['title', 'description', 'status', 'priority', 'startDate', 'endDate', 'budget', 'members'];
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        project[field] = updateData[field];
      }
    });

    await project.save();

    res.json({
      success: true,
      message: 'Project updated successfully',
      project,
    });
  } catch (error) {
    console.error('Update project error:', error);
    next(new AppError('Failed to update project', 500));
  }
};

// @desc    Delete project and detach its tasks
// @route   DELETE /api/project/:projectId
// @access  Private
exports.deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const workspace = await Workspace.findById(project.workspace);
    // Only workspace admin or project creator can delete
    const role = workspace.getUserRole(userId);
    if (role !== 'admin' && project.createdBy.toString() !== userId.toString()) {
      return next(new AppError('Access denied: permissions required', 403));
    }

    // Detach tasks from the project (set project ref to null, but keep tasks)
    await Task.updateMany({ project: projectId }, { $set: { project: null } });

    // Delete project
    await Project.findByIdAndDelete(projectId);

    res.json({
      success: true,
      message: 'Project deleted successfully and tasks detached',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    next(new AppError('Failed to delete project', 500));
  }
};

// @desc    Duplicate a project
// @route   POST /api/project/:projectId/duplicate
// @access  Private
exports.duplicateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const originalProject = await Project.findById(projectId);
    if (!originalProject) {
      return next(new AppError('Project not found', 404));
    }

    const workspace = await Workspace.findById(originalProject.workspace);
    if (!workspace.isMember(userId)) {
      return next(new AppError('Access denied', 403));
    }

    const newProject = new Project({
      title: `${originalProject.title} Copy`,
      description: originalProject.description,
      workspace: originalProject.workspace,
      status: 'Planning', // Reset status of copy to Planning
      priority: originalProject.priority,
      startDate: originalProject.startDate,
      endDate: originalProject.endDate,
      budget: originalProject.budget,
      members: originalProject.members,
      createdBy: userId,
    });

    await newProject.save();

    // Duplicate all tasks from the original project
    const originalTasks = await Task.find({ project: projectId });
    const duplicatePromises = originalTasks.map(async (task) => {
      const newTask = new Task({
        title: task.title,
        description: task.description,
        assignees: task.assignees,
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
        subtasks: task.subtasks.map(st => ({ title: st.title, completed: st.completed })),
        tags: task.tags.map(t => ({ name: t.name, color: t.color })),
        createdBy: userId,
        workspace: task.workspace,
        project: newProject._id,
      });
      return newTask.save();
    });

    await Promise.all(duplicatePromises);

    res.status(201).json({
      success: true,
      message: 'Project duplicated successfully along with its tasks',
      project: newProject,
    });
  } catch (error) {
    console.error('Duplicate project error:', error);
    next(new AppError('Failed to duplicate project', 500));
  }
};
