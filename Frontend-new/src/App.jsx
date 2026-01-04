import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:5000'

function App() {
  const [user, setUser] = useState(null)
  const [content, setContent] = useState([])
  const [currentTrack, setCurrentTrack] = useState(null)
  const [activeTab, setActiveTab] = useState('music')
  const audioRef = useRef(null)

  useEffect(() => {
    if (user) loadContent()
  }, [activeTab, user])

  const loadContent = async () => {
    try {
      let endpoint = '/tracks'
      if (activeTab === 'favorites') {
        endpoint = `/favorites/${user.id}`
      }
      console.log(`Loading content from: ${API_BASE}${endpoint}`)  // Debug
      const response = await axios.get(`${API_BASE}${endpoint}?t=${Date.now()}`) // Cache busting
      console.log('Loaded content:', response.data)  // Debug
      setContent(response.data)
    } catch (error) {
      console.error('Failed to load content:', error)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE}/login`, { username, password })
      const { token, user_id, username: userName, is_admin } = response.data
      setUser({ id: user_id, username: userName, is_admin })
      loadContent()
    } catch (error) {
      alert('Login failed')
    }
  }

  const toggleFavorite = async (trackId) => {
    try {
      await axios.post(`${API_BASE}/favorites/${user.id}`, { track_id: trackId })
      if (activeTab === 'favorites') {
        loadContent() // Refresh favorites list
      }
    } catch (error) {
      console.error('Failed to toggle favorite')
    }
  }

  const playContent = (item) => {
    if (item.file_path) {
      audioRef.current.src = `${API_BASE}/stream/track/${item.id}`
      audioRef.current.play()
    }
    setCurrentTrack(item)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-pink-900 flex items-center justify-center">
        <div className="bg-black/80 backdrop-blur-sm border border-pink-500/30 p-8 rounded-2xl shadow-2xl w-96">
          <h2 className="text-3xl font-bold text-center mb-6 text-pink-400">🎵 Music App</h2>
          <LoginForm onLogin={login} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Navbar */}
      <header className="bg-gradient-to-r from-black to-pink-900 border-b border-pink-500/30 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-pink-400">🎵 Music App</h1>
          
          <nav className="flex space-x-6">
            <button
              onClick={() => {
                setActiveTab('music')
                // Force reload content when switching to music
                setTimeout(() => loadContent(), 100)
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'music' 
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-pink-400'
              }`}
            >
              <span>🎵</span>
              <span>Music</span>
            </button>
            
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'favorites' 
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-pink-400'
              }`}
            >
              <span>❤️</span>
              <span>Favorites</span>
            </button>
            
            {user.is_admin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'admin' 
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-pink-400'
                }`}
              >
                <span>🎛️</span>
                <span>Admin</span>
              </button>
            )}
            
            <button
              onClick={() => setUser(null)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-all"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'admin' && user.is_admin ? (
          <AdminPanel onContentAdded={loadContent} setActiveTab={setActiveTab} />
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-pink-400">
                {activeTab === 'music' ? '🎵 All Music' : '❤️ My Favorites'}
              </h2>
              
              {activeTab === 'music' && (
                <button
                  onClick={loadContent}
                  className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
                >
                  🔄 Refresh
                </button>
              )}
            </div>
            
            <div className="grid gap-4">
              {content.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No songs yet. Upload music via Admin panel!</p>
                </div>
              ) : (
                content.map(item => (
                  <div key={item.id} className="bg-gray-900/50 backdrop-blur-sm border border-pink-500/20 p-6 rounded-xl hover:border-pink-500/40 transition-all hover:shadow-lg hover:shadow-pink-500/10">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-lg text-white">{item.title}</h3>
                        <p className="text-pink-300">{item.artist || item.host}</p>
                        {item.category && <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full mt-2 inline-block">{item.category}</span>}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleFavorite(item.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
                        >
                          ❤️
                        </button>
                        <button
                          onClick={() => playContent(item)}
                          className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-pink-600/30"
                        >
                          ▶ Play
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LoginForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ username: '', email: '', password: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isLogin) {
      onLogin(formData.username, formData.password)
    } else {
      // Register new user
      try {
        const response = await axios.post(`${API_BASE}/register`, {
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
        alert('Registration successful! Please login.')
        setIsLogin(true)
        setFormData({ username: formData.username, email: '', password: '' })
      } catch (error) {
        alert(error.response?.data?.message || 'Registration failed')
      }
    }
  }

  return (
    <div>
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setIsLogin(true)}
          className={`px-4 py-2 rounded-l-lg ${
            isLogin ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setIsLogin(false)}
          className={`px-4 py-2 rounded-r-lg ${
            !isLogin ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          Sign Up
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          className="w-full p-4 bg-gray-900/50 border border-pink-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          required
        />
        
        {!isLogin && (
          <input
            type="email"
            placeholder="Email"
            className="w-full p-4 bg-gray-900/50 border border-pink-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        )}
        
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
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>
      
      {isLogin && (
        <p className="text-center text-sm text-gray-400 mt-4">
          Demo admin: <span className="text-pink-400">admin</span> / <span className="text-pink-400">admin123</span>
        </p>
      )}
    </div>
  )
}

function AdminPanel({ onContentAdded, setActiveTab }) {
  const [formData, setFormData] = useState({
    title: '', artist: '', category: '', file: null
  })
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState('')

  const handleFileChange = (e) => {
    setFormData({...formData, file: e.target.files[0]})
  }

  const uploadFile = async () => {
    if (!formData.file) {
      alert('Please select a file first')
      return
    }

    setUploading(true)
    const fileFormData = new FormData()
    fileFormData.append('file', formData.file)

    try {
      const response = await axios.post(`${API_BASE}/admin/upload`, fileFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setUploadedFile(response.data.file_path)
      alert('File uploaded successfully!')
    } catch (error) {
      alert('Upload failed: ' + (error.response?.data?.message || 'Unknown error'))
    }
    setUploading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!uploadedFile) {
      alert('Please upload a file first')
      return
    }

    try {
      const response = await axios.post(`${API_BASE}/admin/tracks`, {
        title: formData.title,
        artist: formData.artist,
        category: formData.category,
        file_path: uploadedFile
      })
      
      console.log('Track added response:', response.data)  // Debug
      alert(`Track added successfully! ID: ${response.data.id}`)
      
      setFormData({ title: '', artist: '', category: '', file: null })
      setUploadedFile('')
      
      // Force refresh content
      await onContentAdded()
      
      // Auto-switch to music tab and reload
      setTimeout(async () => {
        setActiveTab('music')
        await onContentAdded() // Reload again after tab switch
      }, 500)
      
    } catch (error) {
      console.error('Add track error:', error.response?.data || error.message)
      alert(`Failed to add track: ${error.response?.data?.message || error.message}`)
    }
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-pink-500/20 p-6 rounded-xl max-w-2xl">
      <h3 className="text-2xl font-semibold mb-6 text-pink-400">🎛️ Admin Panel - Upload Music</h3>
      
      {/* File Upload Section */}
      <div className="mb-6 p-4 bg-black/30 rounded-lg border border-pink-500/20">
        <h4 className="text-lg font-medium text-white mb-4">1. Upload Audio File</h4>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept=".mp3,.wav,.m4a,.flac"
            onChange={handleFileChange}
            className="text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-pink-600 file:text-white hover:file:bg-pink-700"
          />
          <button
            onClick={uploadFile}
            disabled={uploading || !formData.file}
            className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-all"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        {uploadedFile && (
          <p className="text-green-400 mt-2">✓ File uploaded: {uploadedFile}</p>
        )}
      </div>

      {/* Track Details Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h4 className="text-lg font-medium text-white">2. Add Track Details</h4>
        
        <input
          type="text"
          placeholder="Song Title"
          className="w-full p-4 bg-black/50 border border-pink-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
        
        <input
          type="text"
          placeholder="Artist Name"
          className="w-full p-4 bg-black/50 border border-pink-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
          value={formData.artist}
          onChange={(e) => setFormData({...formData, artist: e.target.value})}
          required
        />
        
        <input
          type="text"
          placeholder="Category (e.g., Pop, Rock, Hip-Hop)"
          className="w-full p-4 bg-black/50 border border-pink-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
        />
        
        <button
          type="submit"
          disabled={!uploadedFile}
          className="w-full bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-4 rounded-lg font-medium transition-all shadow-lg hover:shadow-pink-600/30"
        >
          Add Track to Library
        </button>
        
        {/* Debug buttons */}
        <div className="flex space-x-2 mt-4">
          <button
            type="button"
            onClick={async () => {
              try {
                const response = await axios.get(`${API_BASE}/tracks`)
                console.log('Backend tracks:', response.data)
                alert(`Backend has ${response.data.length} tracks:\n\n${JSON.stringify(response.data, null, 2)}`)
              } catch (error) {
                alert('Failed to get tracks: ' + error.message)
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
          >
            Check Backend
          </button>
          
          <button
            type="button"
            onClick={() => {
              console.log('Frontend content:', content)
              alert(`Frontend shows ${content.length} tracks:\n\n${JSON.stringify(content, null, 2)}`)
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
          >
            Check Frontend
          </button>
          
          <button
            type="button"
            onClick={async () => {
              try {
                const response = await axios.get(`${API_BASE}/test/add-track`)
                alert('Test track added!')
                // Force reload music list
                await loadContent()
              } catch (error) {
                alert('Test failed')
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
          >
            Add Test Track
          </button>
        </div>
      </form>
    </div>
  )
}

export default App