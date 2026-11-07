import { Authenticator, Button } from "@aws-amplify/ui-react";
import HomeBar from "./components/HomeBar";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Register from "./pages/Register";
import PurchaseList from "./pages/PurchaseList";
import Detail from "./pages/Detail";
//import { useEffect, useState } from 'react';
//import { generateClient } from 'aws-amplify/data';
//import type { Schema } from '../amplify/data/resource';

//const client = generateClient<Schema>();

function App() {
/*
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
*/

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <>
          <div className="App">
            <header className="App-header">
              <h2>{user?.username}</h2>
              <Button onClick={signOut}>SignOut</Button>
            </header>
            <main className="Main">
              <BrowserRouter>
                <HomeBar />
                <div className="MainContent">
                  <Routes>
                    <Route index path="/" element={<Home />} />
                    <Route
                      path="/register"
                      element={<Register />}
                    />
                    <Route path="/shop" element={<Shop />} />
                    <Route
                      path="/cart"
                      element={<Cart />}
                    />
                    <Route path="/purchase" element={<PurchaseList />} />
                    <Route path="/detail" element={null}>
                      <Route path=":id" element={<Detail />} />
                    </Route>
                  </Routes>
                </div>
              </BrowserRouter>
            </main>
            <footer className="App-footer"></footer>
          </div>
        </>
      )}
    </Authenticator>
  );
}

export default App;
