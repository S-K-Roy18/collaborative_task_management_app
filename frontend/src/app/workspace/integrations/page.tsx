'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function IntegrationsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');

  const [githubConnected, setGithubConnected] = useState(false);
  const [slackConnected, setSlackConnected] = useState(false);
  
  const [connectingGithub, setConnectingGithub] = useState(false);
  const [connectingSlack, setConnectingSlack] = useState(false);
  
  const [importingIssues, setImportingIssues] = useState(false);
  const [slackMessage, setSlackMessage] = useState('');
  const [sendingSlack, setSendingSlack] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!workspaceId) {
      router.push('/workspace/dashboard');
    }
  }, [workspaceId, router]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleConnectGithub = () => {
    setConnectingGithub(true);
    setTimeout(() => {
      setConnectingGithub(false);
      setGithubConnected(true);
      showToast('Successfully connected to GitHub (Simulated)');
    }, 1500);
  };

  const handleConnectSlack = () => {
    setConnectingSlack(true);
    setTimeout(() => {
      setConnectingSlack(false);
      setSlackConnected(true);
      showToast('Successfully connected to Slack (Simulated)');
    }, 1500);
  };

  const handleImportIssues = async () => {
    setImportingIssues(true);
    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      
      // Simulate fetching from GitHub and creating tasks
      const mockIssues = [
        { title: '[GitHub] Fix Navigation Bug', description: 'Navigation links are broken on mobile.', priority: 'High', status: 'Todo' },
        { title: '[GitHub] Update README', description: 'Add setup instructions for the backend.', priority: 'Medium', status: 'Todo' },
        { title: '[GitHub] Refactor Auth Component', description: 'Clean up the authentication hooks.', priority: 'Low', status: 'Todo' }
      ];

      let successCount = 0;
      for (const issue of mockIssues) {
        const res = await fetch(`${backendUrl}/api/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            workspace: workspaceId,
            title: issue.title,
            description: issue.description,
            priority: issue.priority,
            status: issue.status
          })
        });
        if (res.ok) successCount++;
      }

      showToast(`Successfully imported ${successCount} issues as tasks!`);
    } catch (err) {
      showToast('Error importing issues.');
    } finally {
      setImportingIssues(false);
    }
  };

  const handleSendSlack = () => {
    if (!slackMessage) return;
    setSendingSlack(true);
    setTimeout(() => {
      setSendingSlack(false);
      setSlackMessage('');
      showToast('Message sent to Slack channel #general (Simulated)');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-3 transform transition-all animate-bounce">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Integrations
            </h1>
            <p className="text-slate-500 mt-2">Connect third-party apps to supercharge your workspace.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* GitHub Card */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            
            <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center mb-6 shadow-md">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">GitHub</h2>
            <p className="text-slate-500 text-sm mb-8 flex-grow">Connect your repository to import issues directly into your Kanban board.</p>
            
            {!githubConnected ? (
              <button 
                onClick={handleConnectGithub}
                disabled={connectingGithub}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                {connectingGithub ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <span>Connect to GitHub</span>
                )}
              </button>
            ) : (
              <div className="w-full space-y-3">
                <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg font-medium text-sm mb-4">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  <span>Connected to organization-repo</span>
                </div>
                <button 
                  onClick={handleImportIssues}
                  disabled={importingIssues}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center border border-blue-200"
                >
                  {importingIssues ? 'Importing...' : 'Import Issues as Tasks'}
                </button>
                <button 
                  onClick={() => setGithubConnected(false)}
                  className="w-full text-gray-400 hover:text-red-500 text-sm font-medium py-2 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>

          {/* Slack Card */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            
            <div className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522v-2.521zm-1.271 0a2.528 2.528 0 01-2.521 2.521 2.528 2.528 0 01-2.521-2.521V2.522A2.528 2.528 0 0115.164 0a2.528 2.528 0 012.521 2.522v6.312zM15.166 18.958a2.528 2.528 0 012.521 2.52 2.528 2.528 0 01-2.521 2.522 2.528 2.528 0 01-2.521-2.522v-2.52h2.521zm0-1.271a2.528 2.528 0 01-2.521-2.52 2.528 2.528 0 012.521-2.521h6.313A2.528 2.528 0 0124 15.167a2.528 2.528 0 01-2.522 2.521h-6.313z" fill="#E01E5A"/>
              </svg>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">Slack</h2>
            <p className="text-slate-500 text-sm mb-8 flex-grow">Connect your workspace to receive real-time notifications in your Slack channels.</p>
            
            {!slackConnected ? (
              <button 
                onClick={handleConnectSlack}
                disabled={connectingSlack}
                className="w-full bg-[#4A154B] hover:bg-[#3b113c] text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                {connectingSlack ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <span>Connect to Slack</span>
                )}
              </button>
            ) : (
              <div className="w-full space-y-3">
                <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg font-medium text-sm mb-4">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  <span>Connected to #general</span>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={slackMessage}
                    onChange={(e) => setSlackMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button 
                    onClick={handleSendSlack}
                    disabled={sendingSlack || !slackMessage}
                    className="bg-[#4A154B] hover:bg-[#3b113c] text-white font-semibold px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
                <button 
                  onClick={() => setSlackConnected(false)}
                  className="w-full text-gray-400 hover:text-red-500 text-sm font-medium py-2 transition-colors mt-2"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function IntegrationsDashboardWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-xl text-indigo-600 font-semibold">Loading Integrations...</div>
      </div>
    }>
      <IntegrationsDashboard />
    </Suspense>
  );
}
