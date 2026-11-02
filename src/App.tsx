import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema['Todo']['type']>>([]);
  const [content, setContent] = useState('');

  // データのリアルタイム取得
  useEffect(() => {
    const sub = client.models.Todo.observeQuery().subscribe({
      next: ({ items }) => setTodos([...items]),
      error: (err) => console.error("データ取得エラー:", err)
    });
    return () => sub.unsubscribe();
  }, []);

  // 1. タスクの作成
  const createTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await client.models.Todo.create({
        content: content,
        isDone: false,
      });
      setContent('');
    } catch (err) {
      console.error("データ作成エラー:", err);
    }
  };

  // 2. タスクの完了/未完了の切り替え (更新)
  const toggleTodo = async (todo: Schema['Todo']['type']) => {
    try {
      await client.models.Todo.update({
        id: todo.id,
        isDone: !todo.isDone, // 状態を反転させて更新
      });
    } catch (err) {
      console.error("データ更新エラー:", err);
    }
  };

  // 3. タスクの削除
  const deleteTodo = async (id: string) => {
    try {
      await client.models.Todo.delete({ id });
    } catch (err) {
      console.error("データ削除エラー:", err);
    }
  };

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1>俺のTodoリスト</h1>
            <div>
              <span style={{ marginRight: '10px', fontSize: '14px' }}>{user?.username} さん</span>
              <button onClick={signOut} style={{ cursor: 'pointer' }}>ログアウト</button>
            </div>
          </div>
          
          <form onSubmit={createTodo} style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="自分専用のタスクを入力..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ flex: 1, padding: '8px', fontSize: '16px' }}
            />
            <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>追加</button>
          </form>

          <ul style={{ padding: 0, listStyle: 'none' }}>
            {todos.map((todo) => (
              <li 
                key={todo.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '10px',
                  borderBottom: '1px solid #eee',
                  background: '#fff',
                  marginBottom: '5px',
                  borderRadius: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* 💡 完了切り替え用のチェックボックス */}
                  <input 
                    type="checkbox" 
                    checked={todo.isDone || false} 
                    onChange={() => toggleTodo(todo)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ textDecoration: todo.isDone ? 'line-through' : 'none', color: todo.isDone ? '#888' : '#333' }}>
                    {todo.content}
                  </span>
                </div>
                {/* 💡 削除ボタン */}
                <button 
                  onClick={() => deleteTodo(todo.id)}
                  style={{ 
                    background: '#ff4d4f', 
                    color: '#fff', 
                    border: 'none', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Authenticator>
  );
}

export default App;
