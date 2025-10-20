/**
 * TEMPORARY DATABASE CONNECTION TEST
 * 
 * Import and use this component to test your Firebase Realtime Database connection
 * 
 * Usage in Login.tsx or any component:
 * import TestDatabaseConnection from './test-database-connection';
 * 
 * Then add <TestDatabaseConnection /> to your JSX
 */

import { useEffect, useState } from 'react';
import { ref, get, set } from 'firebase/database';
import { database } from '@/lib/firebase';

const TestDatabaseConnection = () => {
  const [status, setStatus] = useState<string>('Testing...');
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    console.log('🔍 Starting Firebase Database Connection Test...');
    
    try {
      // Test 1: Check if database object exists
      console.log('Test 1: Database object exists?', !!database);
      if (!database) {
        setError('Database object is null - check firebase.ts initialization');
        setStatus('❌ Failed');
        return;
      }

      // Test 2: Try to read root
      console.log('Test 2: Attempting to read root...');
      const rootRef = ref(database, '/');
      const rootSnapshot = await get(rootRef);
      console.log('✅ Root read successful');
      console.log('Root exists:', rootSnapshot.exists());
      console.log('Root data:', rootSnapshot.val());

      // Test 3: Try to read users
      console.log('Test 3: Attempting to read /users...');
      const usersRef = ref(database, 'users');
      const usersSnapshot = await get(usersRef);
      console.log('✅ Users read successful');
      console.log('Users exist:', usersSnapshot.exists());
      console.log('Users data:', usersSnapshot.val());

      // Test 4: Try to write test data
      console.log('Test 4: Attempting to write test data...');
      const testRef = ref(database, 'test_connection');
      await set(testRef, {
        timestamp: new Date().toISOString(),
        message: 'Connection test successful'
      });
      console.log('✅ Write successful');

      // Test 5: Read back the test data
      console.log('Test 5: Reading back test data...');
      const testSnapshot = await get(testRef);
      console.log('✅ Read back successful');
      console.log('Test data:', testSnapshot.val());

      setStatus('✅ All tests passed!');
      setDetails({
        rootExists: rootSnapshot.exists(),
        usersExist: usersSnapshot.exists(),
        usersData: usersSnapshot.val(),
        testData: testSnapshot.val(),
      });

      console.log('🎉 All database tests passed!');
    } catch (err: any) {
      console.error('❌ Database test failed:', err);
      setError(err.message || err.toString());
      setStatus('❌ Failed');
      
      // Log detailed error info
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        stack: err.stack,
      });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      padding: '20px',
      background: error ? '#fee' : details ? '#efe' : '#fff',
      border: '2px solid',
      borderColor: error ? '#f00' : details ? '#0f0' : '#ccc',
      borderRadius: '8px',
      maxWidth: '400px',
      zIndex: 9999,
      fontSize: '12px',
      fontFamily: 'monospace',
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>Database Connection Test</h3>
      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong> {status}
      </div>
      
      {error && (
        <div style={{ 
          padding: '10px', 
          background: '#fcc', 
          borderRadius: '4px',
          marginBottom: '10px',
          wordBreak: 'break-word'
        }}>
          <strong>Error:</strong><br />
          {error}
        </div>
      )}
      
      {details && (
        <div style={{ 
          padding: '10px', 
          background: '#cfc', 
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <div><strong>Root exists:</strong> {details.rootExists ? 'Yes' : 'No'}</div>
          <div><strong>Users exist:</strong> {details.usersExist ? 'Yes' : 'No'}</div>
          {details.usersData && (
            <div>
              <strong>Users found:</strong> {Object.keys(details.usersData).join(', ')}
            </div>
          )}
        </div>
      )}
      
      <div style={{ fontSize: '10px', color: '#666', marginTop: '10px' }}>
        Check browser console (F12) for detailed logs
      </div>
      
      <button 
        onClick={testConnection}
        style={{
          marginTop: '10px',
          padding: '5px 10px',
          cursor: 'pointer',
        }}
      >
        Re-test Connection
      </button>
    </div>
  );
};

export default TestDatabaseConnection;
