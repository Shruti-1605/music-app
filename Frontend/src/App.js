import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [content, setContent] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [activeTab, setActiveTab] = useState('music');
  const audioRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadContent();
    }
  }, [activeTab]);

  const loadContent = async () => {
    try {
      const endpoint = activeTab === 'music' ? '/tracks' : '/podcasts';
      const response = await axios.get(`${API_BASE}${endpoint}`);
      setContent(response.data);
    } catch (error) {
      console.error('Failed to load content');
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE}/login`, { username, password });
      const { token, user_id, is_admin } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser({ id: user_id, username, is_admin });
      loadContent();
    } catch (error) {
      alert('Login failed');
    }
  };

  const playContent = (item) => {
    audioRef.current.src = `${API_BASE}/stream/${item.type}/${item.id}`;
    audioRef.current.play();
    setCurrentTrack(item);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-pink-900 flex items-center justify-center">
        <div className="bg-black/80 backdrop-blur-sm border border-pink-500/30 p-8 rounded-2xl shadow-2xl w-96">
          <h2 className="text-3xl font-bold text-center mb-6 text-pink-400">🎵 Music App</h2>
          <LoginForm onLogin={login} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-gradient-to-r from-black to-pink-900 border-b border-pink-500/30 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-pink-400">🎵 Music Streaming</h1>
        <button 
          onClick={() => { localStorage.removeItem('token'); setUser(null); }}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Logout
        </button>
      </header>

      <div className="container mx-auto p-4">
        <nav className="flex space-x-4 mb-6">
          {['music', 'podcasts'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg capitalize font-medium transition-all ${
                activeTab === tab 
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-pink-400'
              }`}
            >
              {tab}
            </button>
          ))}
          {user.is_admin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'admin' 
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-pink-400'
              }`}
            >
              Admin
            </button>
          )}
        </nav>

        {activeTab === 'admin' && user.is_admin ? (
          <AdminPanel onContentAdded={loadContent} />
        ) : (
          <div className="grid gap-4">
            {content.map(item => (
              <div key={item.id} className="bg-gray-900/50 backdrop-blur-sm border border-pink-500/20 p-6 rounded-xl hover:border-pink-500/40 transition-all hover:shadow-lg hover:shadow-pink-500/10">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg text-white">{item.title}</h3>
                    <p className="text-pink-300">{item.artist || item.host}</p>
                    {item.category && <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full mt-2 inline-block">{item.category}</span>}
                  </div>
                  <button
                    onClick={() => playContent(item)}
                    className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-pink-600/30"
                  >
                    ▶ Play
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-pink-500/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {currentTrack ? (
              <div>
                <p className="font-semibold text-pink-400">{currentTrack.title}</p>
                <p className="text-gray-400 text-sm">{currentTrack.artist || currentTrack.host}</p>
              </div>
            ) : (
              <p className="text-gray-500">No track selected</p>
            )}
          </div>
          <audio ref={audioRef} controls className="ml-4 bg-gray-800 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onLogin }) {
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(formData.username, formData.password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Username"
        className="w-full p-4 bg-gray-900/50 border border-pink-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
        value={formData.username}
        onChange={(e) => setFormData({...formData, username: e.target.value})}
        required
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full p-4 bg-gray-900/50 border border-pink-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        required
      />
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white p-4 rounded-lg font-medium transition-all shadow-lg hover:shadow-pink-600/30"
      >
        Login
      </button>
      <p className="text-center text-sm text-gray-400">
        Default admin: <span className="text-pink-400">admin</span> / <span className="text-pink-400">admin123</span>
      </p>
    </form>
  );
}

function AdminPanel({ onContentAdded }) {
  const [formData, setFormData] = useState({
    title: '', artist: '', file_path: '', is_podcast: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/admin/tracks`, formData);
      alert('Content added!');
      setFormData({ title: '', artist: '', file_path: '', is_podcast: false });
      onContentAdded();
    } catch (error) {
      alert('Failed to add content');
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-pink-500/20 p-6 rounded-xl">
      <h3 className="text-xl font-semibold mb-6 text-pink-400">🎛️ Admin Panel</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          className="w-full p-4 bg-black/50 border border-pink-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="Artist/Host"
          className="w-full p-4 bg-black/50 border border-pink-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
          value={formData.artist}
          onChange={(e) => setFormData({...formData, artist: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="File Path"
          className="w-full p-4 bg-black/50 border border-pink-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
          value={formData.file_path}
          onChange={(e) => setFormData({...formData, file_path: e.target.value})}
          required
        />
        <label className="flex items-center text-gray-300">
          <input
            type="checkbox"
            checked={formData.is_podcast}
            onChange={(e) => setFormData({...formData, is_podcast: e.target.checked})}
            className="mr-3 w-4 h-4 text-pink-600 bg-gray-800 border-pink-500 rounded focus:ring-pink-500"
          />
          Is Podcast
        </label>
        <button
          type="submit"
          className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white px-8 py-4 rounded-lg font-medium transition-all shadow-lg hover:shadow-pink-600/30"
        >
          Add Content
        </button>
      </form>
    </div>
  );
}

export default App;