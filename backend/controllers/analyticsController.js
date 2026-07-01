const Task = require('../models/Task');
const mongoose = require('mongoose');

// @route   GET /api/analytics/workspace/:workspaceId
// @desc    Get comprehensive analytics for a workspace
// @access  Private
exports.getWorkspaceAnalytics = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    // 1. Task Status Distribution
    const statusDistribution = await Task.aggregate([
      { $match: { workspace: new mongoose.Types.ObjectId(workspaceId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // 2. Task Priority Distribution
    const priorityDistribution = await Task.aggregate([
      { $match: { workspace: new mongoose.Types.ObjectId(workspaceId) } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // 3. Workload Distribution (Tasks per Assignee)
    const workloadDistribution = await Task.aggregate([
      { $match: { workspace: new mongoose.Types.ObjectId(workspaceId) } },
      { $unwind: { path: '$assignees', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$assignees',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ['$user.name', 'Unassigned'] },
          count: 1
        }
      }
    ]);

    // 4. Tasks completed over time (last 30 days)
    // Assuming 'updatedAt' is when it was moved to 'Done' for simplicity in this dataset
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const completionTrends = await Task.aggregate([
      { 
        $match: { 
          workspace: new mongoose.Types.ObjectId(workspaceId),
          status: 'Done',
          updatedAt: { $gte: thirtyDaysAgo }
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format the responses
    res.status(200).json({
      success: true,
      data: {
        statusDistribution: statusDistribution.map(item => ({ name: item._id || 'Todo', value: item.count })),
        priorityDistribution: priorityDistribution.map(item => ({ name: item._id || 'Medium', value: item.count })),
        workloadDistribution: workloadDistribution.map(item => ({ name: item.name, value: item.count })),
        completionTrends: completionTrends.map(item => ({ date: item._id, completed: item.count }))
      }
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ success: false, error: 'Server Error calculating analytics' });
  }
};
