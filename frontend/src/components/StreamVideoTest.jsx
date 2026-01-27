import React, { useEffect, useState } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const StreamVideoTest = () => {
  const [testStatus, setTestStatus] = useState('initializing');
  const [error, setError] = useState(null);
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  useEffect(() => {
    const testStreamVideo = async () => {
      try {
        console.log('🧪 Testing Stream Video SDK...');
        console.log('🧪 API Key exists:', !!STREAM_API_KEY);
        
        if (!STREAM_API_KEY) {
          throw new Error('Stream API Key not found');
        }

        // Test if StreamVideoClient can be instantiated
        console.log('🧪 Testing StreamVideoClient instantiation...');
        const testClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: {
            id: 'test-user',
            name: 'Test User'
          },
          token: 'test-token'
        });
        
        console.log('✅ StreamVideoClient instantiated successfully');
        setTestStatus('client-created');
        
        // Test if we can create a call instance
        console.log('🧪 Testing call instance creation...');
        const testCall = testClient.call('default', 'test-call-id');
        console.log('✅ Call instance created successfully');
        
        setClient(testClient);
        setCall(testCall);
        setTestStatus('success');
        
      } catch (err) {
        console.error('❌ Stream Video SDK test failed:', err);
        setError(err.message);
        setTestStatus('error');
      }
    };

    testStreamVideo();
  }, []);

  if (testStatus === 'initializing') {
    return (
      <div className="p-4">
        <h3>🧪 Testing Stream Video SDK...</h3>
        <p>Initializing...</p>
      </div>
    );
  }

  if (testStatus === 'error') {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <h3>❌ Stream Video SDK Test Failed</h3>
        <p><strong>Error:</strong> {error}</p>
        <details className="mt-2">
          <summary>Debug Info</summary>
          <pre className="text-xs bg-gray-100 p-2 mt-2 rounded">
            {JSON.stringify({
              STREAM_API_KEY: !!STREAM_API_KEY,
              error: error,
              testStatus: testStatus
            }, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  if (testStatus === 'success') {
    return (
      <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
        <h3>✅ Stream Video SDK Test Passed</h3>
        <p>All components loaded successfully!</p>
        <details className="mt-2">
          <summary>Debug Info</summary>
          <pre className="text-xs bg-gray-100 p-2 mt-2 rounded">
            {JSON.stringify({
              STREAM_API_KEY: !!STREAM_API_KEY,
              hasClient: !!client,
              hasCall: !!call,
              testStatus: testStatus
            }, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3>🧪 Stream Video SDK Test</h3>
      <p>Status: {testStatus}</p>
    </div>
  );
};

export default StreamVideoTest;
