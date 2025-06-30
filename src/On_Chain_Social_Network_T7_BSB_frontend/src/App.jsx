import { On_Chain_Social_Network_T7_BSB_backend } from "declarations/On_Chain_Social_Network_T7_BSB_backend";
import { useEffect, useState } from "react";
import "./App.scss";

function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("feed");

  // Form states
  const [newPostContent, setNewPostContent] = useState("");
  const [profileForm, setProfileForm] = useState({ username: "", bio: "" });
  const [showCreateProfile, setShowCreateProfile] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser =
        await On_Chain_Social_Network_T7_BSB_backend.get_user();
      setUser(currentUser[0] || null);

      if (currentUser[0]) {
        const feed = await On_Chain_Social_Network_T7_BSB_backend.get_feed();
        setPosts(feed);
      } else {
        const allPosts =
          await On_Chain_Social_Network_T7_BSB_backend.get_all_posts();
        setPosts(allPosts);
      }

      const users =
        await On_Chain_Social_Network_T7_BSB_backend.get_all_users();
      setAllUsers(users);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    if (!profileForm.username.trim()) return;

    try {
      await On_Chain_Social_Network_T7_BSB_backend.create_user(
        profileForm.username,
        profileForm.bio
      );
      await loadUserData();
      setShowCreateProfile(false);
      setProfileForm({ username: "", bio: "" });
    } catch (error) {
      console.error("Error creating profile:", error);
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim()) return;

    try {
      await On_Chain_Social_Network_T7_BSB_backend.create_post(newPostContent);
      setNewPostContent("");
      await loadUserData();
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const likePost = async (postId) => {
    try {
      await On_Chain_Social_Network_T7_BSB_backend.like_post(postId);
      await loadUserData();
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const followUser = async (userPrincipal) => {
    try {
      await On_Chain_Social_Network_T7_BSB_backend.follow_user(userPrincipal);
      await loadUserData();
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user && !showCreateProfile) {
    return (
      <div className="app">
        <div className="welcome">
          <h1>Welcome to On-Chain Social Network</h1>
          <p>Create your profile to get started!</p>
          <button
            onClick={() => setShowCreateProfile(true)}
            className="btn-primary"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  if (showCreateProfile) {
    return (
      <div className="app">
        <div className="profile-form">
          <h2>Create Your Profile</h2>
          <input
            type="text"
            placeholder="Username"
            value={profileForm.username}
            onChange={(e) =>
              setProfileForm({ ...profileForm, username: e.target.value })
            }
          />
          <textarea
            placeholder="Bio (optional)"
            value={profileForm.bio}
            onChange={(e) =>
              setProfileForm({ ...profileForm, bio: e.target.value })
            }
          />
          <div className="form-actions">
            <button onClick={createProfile} className="btn-primary">
              Create Profile
            </button>
            <button
              onClick={() => setShowCreateProfile(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>On-Chain Social Network</h1>
        <div className="user-info">
          <span>Welcome, {user?.username}!</span>
        </div>
      </header>

      <nav className="nav">
        <button
          className={activeTab === "feed" ? "active" : ""}
          onClick={() => setActiveTab("feed")}
        >
          Feed
        </button>
        <button
          className={activeTab === "create" ? "active" : ""}
          onClick={() => setActiveTab("create")}
        >
          Create Post
        </button>
        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
      </nav>

      <main className="main">
        {activeTab === "feed" && (
          <div className="feed">
            <h2>Your Feed</h2>
            {posts.length === 0 ? (
              <p>No posts yet. Follow some users or create your first post!</p>
            ) : (
              posts.map((post, index) => (
                <div key={index} className="post">
                  <h3>
                    {allUsers.find(([id]) => id === post.author)?.[1]
                      ?.username || "Unknown User"}
                  </h3>
                  <p className="post-content">{post.content}</p>
                  <div className="post-actions">
                    <button
                      onClick={() => likePost(post.id)}
                      className="like-btn"
                    >
                      👍 {post.likes.length}
                    </button>
                    <span className="timestamp">
                      {new Date(
                        Number(post.timestamp) / 1000000
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "create" && (
          <div className="create-post">
            <h2>Create New Post</h2>
            <textarea
              placeholder="What's on your mind?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={4}
            />
            <button onClick={createPost} className="btn-primary">
              Post
            </button>
          </div>
        )}

        {activeTab === "users" && (
          <div className="users">
            <h2>All Users</h2>
            {allUsers.map(([principal, userData]) => (
              <div key={principal} className="user-card">
                <h3>{userData.username}</h3>
                <p>{userData.bio}</p>
                <p>Followers: {userData.followers.length}</p>
                <button
                  onClick={() => followUser(principal)}
                  className="btn-secondary"
                >
                  Follow
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
