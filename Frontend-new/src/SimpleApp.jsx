import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:5000'

function App() {
  const [user, setUser] = useState(null)
  const [tracks, setTracks] = useState([])
  const [activeTab, setActiveTab] = useState('music')
  const audioRef = useRef(null)

  const loadTracks = async () => {
    try {
      console.log('Loading tracks...')
      const response = await axios.get(`${API_BASE}/tracks`)
      console.log('Loaded tracks:', response.data)
      setTracks(response.data)
    } catch (error) {
      console.error('Failed to load tracks:', error)
    }
  }

  useEffect(() => {
    if (user && activeTab === 'music') {
      loadTracks()
    }
  }, [user, activeTab])

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE}/login`, { username, password })
      setUser(response.data)
      loadTracks()
    } catch (error) {
      alert('Login failed')
    }
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
      <header className="bg-gradient-to-r from-black to-pink-900 border-b border-pink-500/30 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-pink-400">🎵 Music App</h1>
          
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab('music')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'music' 
                  ? 'bg-pink-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-pink-400'
              }`}
            >
              <span>🎵</span>
              <span>Music</span>
            </button>
            
            {user.is_admin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'admin' 
                    ? 'bg-pink-600 text-white' 
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

      <div className="p-6">
        {activeTab === 'admin' && user.is_admin ? (
          <AdminPanel onTrackAdded={loadTracks} />
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-pink-400">🎵 All Music ({tracks.length})</h2>
              <button
                onClick={loadTracks}
                className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                🔄 Refresh
              </button>
            </div>
            
            {tracks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎵</div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Music Yet</h3>
                <p className="text-gray-500">Upload your first song via Admin panel!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tracks.map((track, index) => {
                  // Random album cover images from Unsplash
                  const albumImages = [
                    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop'
                  ]
                  const albumImage = albumImages[index % albumImages.length]
                  
                  return (
                    <div key={track.id} className="bg-gradient-to-br from-gray-900 to-gray-800 border border-pink-500/20 rounded-xl p-6 hover:border-pink-500/40 transition-all hover:shadow-lg hover:shadow-pink-500/20 group">
                      {/* Real Album Cover Image */}
                      <div className="w-full h-48 rounded-lg mb-4 overflow-hidden border border-pink-500/30">
                        <img 
                          src={albumImage}
                          alt={`${track.title} album cover`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      
                      {/* Song Info */}
                      <div className="mb-4">
                        <h3 className="font-bold text-lg text-white mb-1 truncate" title={track.title}>
                          {track.title}
                        </h3>
                        <p className="text-pink-300 text-sm mb-2 truncate" title={track.artist}>
                          {track.artist}
                        </p>
                        {track.category && (
                          <span className="inline-block bg-pink-600/20 text-pink-300 text-xs px-2 py-1 rounded-full border border-pink-500/30">
                            {track.category}
                          </span>
                        )}
                      </div>
                      
                      {/* Controls */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            audioRef.current.src = `${API_BASE}/stream/track/${track.id}`
                            audioRef.current.play()
                          }}
                          className="flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg font-medium transition-all group-hover:shadow-lg group-hover:shadow-pink-600/30"
                        >
                          <span>▶</span>
                          <span>Play</span>
                        </button>
                        
                        <div className="flex space-x-2">
                          <button className="p-2 text-gray-400 hover:text-pink-400 transition-colors">
                            ❤️
                          </button>
                          <button className="p-2 text-gray-400 hover:text-pink-400 transition-colors">
                            ⋯
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}))}
              </div>
            )}
          </div>
        )}
      </div>
      
      <audio ref={audioRef} controls className="fixed bottom-4 right-4 bg-gray-900 rounded-lg border border-pink-500/30" />
    </div>
  )
}

function LoginForm({ onLogin }) {
  const [formData, setFormData] = useState({ username: '', password: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    onLogin(formData.username, formData.password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Username"
        className="w-full p-4 bg-gray-900/50 border border-pink-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
        value={formData.username}
        onChange={(e) => setFormData({...formData, username: e.target.value})}
        required
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full p-4 bg-gray-900/50 border border-pink-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        required
      />
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white p-4 rounded-lg font-medium transition-all"
      >
        Login
      </button>
      <p className="text-center text-sm text-gray-400">
        Admin: <span className="text-pink-400">admin</span> / <span className="text-pink-400">admin123</span>
      </p>
    </form>
  )
}

function AdminPanel({ onTrackAdded }) {
  const [formData, setFormData] = useState({ title: '', artist: '', category: '', albumCover: '', file: null })
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState('')

  const uploadFile = async () => {
    if (!formData.file) {
      alert('Please select a file')
      return
    }

    setUploading(true)
    const fileFormData = new FormData()
    fileFormData.append('file', formData.file)

    try {
      const response = await axios.post(`${API_BASE}/admin/upload`, fileFormData)
      setUploadedFile(response.data.file_path)
      alert('File uploaded!')
    } catch (error) {
      alert('Upload failed')
    }
    setUploading(false)
  }

  const addTrack = async (e) => {
    e.preventDefault()
    
    if (!uploadedFile) {
      alert('Please upload a file first')
      return
    }

    try {
      await axios.post(`${API_BASE}/admin/tracks`, {
        title: formData.title,
        artist: formData.artist,
        category: formData.category,
        file_path: uploadedFile
      })
      
      alert('Track added successfully!')
      setFormData({ title: '', artist: '', category: '', file: null })
      setUploadedFile('')
      
      // Refresh tracks list
      onTrackAdded()
      
    } catch (error) {
      alert('Failed to add track')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-pink-500/20 rounded-xl p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🎛️</div>
          <h3 className="text-3xl font-bold text-pink-400 mb-2">Music Upload Studio</h3>
          <p className="text-gray-400">Add new songs to your music library</p>
        </div>
        
        {/* Upload Section */}
        <div className="mb-8 p-6 bg-black/30 rounded-xl border border-pink-500/20">
          <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">📁</span>
            Step 1: Upload Audio File
          </h4>
          
          <div className="border-2 border-dashed border-pink-500/30 rounded-lg p-8 text-center hover:border-pink-500/50 transition-colors">
            <div className="text-3xl mb-4">🎵</div>
            <input
              type="file"
              accept=".mp3,.wav,.m4a,.flac"
              onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
              className="hidden"
              id="file-upload"
            />
            <label 
              htmlFor="file-upload"
              className="cursor-pointer inline-block bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
            >
              Choose Audio File
            </label>
            <p className="text-gray-400 text-sm mt-2">MP3, WAV, M4A, FLAC supported</p>
            
            {formData.file && (
              <div className="mt-4 p-3 bg-green-600/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400">✓ Selected: {formData.file.name}</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-center">
            <button
              onClick={uploadFile}
              disabled={uploading || !formData.file}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg"
            >
              {uploading ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="mr-2">☁️</span>
                  Upload File
                </span>
              )}
            </button>
          </div>
          
          {uploadedFile && (
            <div className="mt-4 p-4 bg-green-600/20 border border-green-500/30 rounded-lg">
              <p className="text-green-400 font-medium">✓ File uploaded successfully: {uploadedFile}</p>
            </div>
          )}
        </div>

        {/* Track Details Form */}
        <form onSubmit={addTrack} className="space-y-6">
          <h4 className="text-xl font-semibold text-white flex items-center">
            <span className="mr-2">✏️</span>
            Step 2: Add Song Details
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Song Title *</label>
              <input
                type="text"
                placeholder="Enter song title"
                className="w-full p-4 bg-black/50 border border-pink-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Artist Name *</label>
              <input
                type="text"
                placeholder="Enter artist name"
                className="w-full p-4 bg-black/50 border border-pink-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                value={formData.artist}
                onChange={(e) => setFormData({...formData, artist: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              className="w-full p-4 bg-black/50 border border-pink-500/30 rounded-lg text-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="">Select category</option>
              <option value="Pop">Pop</option>
              <option value="Rock">Rock</option>
              <option value="Hip-Hop">Hip-Hop</option>
              <option value="Electronic">Electronic</option>
              <option value="Jazz">Jazz</option>
              <option value="Classical">Classical</option>
              <option value="R&B">R&B</option>
              <option value="Country">Country</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="text-center pt-4">
            <button
              type="submit"
              disabled={!uploadedFile}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-12 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              <span className="flex items-center">
                <span className="mr-2">✨</span>
                Add to Music Library
                <span className="ml-2">🎵</span>
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default App