import React, { useEffect, useState } from "react";
import { useAuth } from "./Auth";
import "./App.scss";

function App() {
  const { isAuthenticated, login, logout, actor, principal } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("feed");
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState({});

  // Form states
  const [newPostContent, setNewPostContent] = useState("");
  const [profileForm, setProfileForm] = useState({ username: "", bio: "" });
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [newCommentContent, setNewCommentContent] = useState("");

  useEffect(() => {
    console.log("App.jsx useEffect: isAuthenticated", isAuthenticated, "actor", actor);
    if (actor) {
      loadUserData();
    } else if (!isAuthenticated) {
      setLoading(false);
    }
  }, [actor]);

  const loadUserData = async () => {
    if (!actor) return; // Ensure actor is available
    try {
      setLoading(true);
      const currentUser = await actor.get_user();
      setUser(currentUser[0] || null);

      const users = await actor.get_all_users();
      setAllUsers(users);

      if (currentUser[0]) {
        const feed = await actor.get_feed();
        setPosts(feed);
      } else {
        const allPosts = await actor.get_all_posts();
        setPosts(allPosts);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    if (!profileForm.username.trim() || !actor) return; // Ensure actor is available

    try {
      await actor.create_user(profileForm.username, profileForm.bio);
      await loadUserData();
      setShowCreateProfile(false);
      setProfileForm({ username: "", bio: "" });
    } catch (error) {
      console.error("Error creating profile:", error);
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim() || !actor) return; // Ensure actor is available

    try {
      await actor.create_post(newPostContent);
      setNewPostContent("");
      await loadUserData();
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const likePost = async (postId) => {
    if (!actor) return; // Ensure actor is available
    try {
      await actor.like_post(postId);
      await loadUserData();
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const unlikePost = async (postId) => {
    if (!actor) return; // Ensure actor is available
    try {
      await actor.unlike_post(postId);
      await loadUserData();
    } catch (error) {
      console.error("Error unliking post:", error);
    }
  };

  const followUser = async (userPrincipal) => {
    if (!actor) return; // Ensure actor is available
    try {
      await actor.follow_user(userPrincipal);
      await loadUserData();
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const unfollowUser = async (userPrincipal) => {
    if (!actor) return; // Ensure actor is available
    try {
      await actor.unfollow_user(userPrincipal);
      await loadUserData();
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  const deletePost = async (postId) => {
    if (!actor) return; // Ensure actor is available
    try {
      await actor.delete_post(postId);
      await loadUserData();
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const editProfile = async () => {
    if (!profileForm.username.trim() || !actor) return; // Ensure actor is available

    try {
      await actor.edit_profile(profileForm.username, profileForm.bio);
      await loadUserData();
      setShowEditProfile(false);
      setProfileForm({ username: "", bio: "" });
    } catch (error) {
      console.error("Error editing profile:", error);
    }
  };

  const addComment = async (postId) => {
    if (!newCommentContent.trim() || !actor) return; // Ensure actor is available

    try {
      await actor.add_comment(postId, newCommentContent);
      setNewCommentContent("");
      await loadComments(postId);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const loadComments = async (postId) => {
    if (!actor) return; // Ensure actor is available
    try {
      const postComments = await actor.get_comments(postId);
      setComments(postComments);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const toggleComments = async (postId) => {
    if (!actor) return; // Ensure actor is available
    const isVisible = showComments[postId];
    if (!isVisible) {
      await loadComments(postId);
    }
    setShowComments((prev) => ({
      ...prev,
      [postId]: !isVisible,
    }));
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="app">
        <div className="welcome">
          <h1>Welcome to On-Chain Social Network</h1>
          <button onClick={login} className="btn-primary">
            Login to Continue
          </button>
        </div>
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
            disabled={!actor} // Disable button if actor is not ready
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
            <button onClick={createProfile} className="btn-primary" disabled={!actor}>
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

  if (showEditProfile) {
    return (
      <div className="app">
        <div className="profile-form">
          <h2>Edit Your Profile</h2>
          <input
            type="text"
            placeholder="Username"
            value={profileForm.username}
            onChange={(e) =>
              setProfileForm({ ...profileForm, username: e.target.value })
            }
          />
          <textarea
            placeholder="Bio"
            value={profileForm.bio}
            onChange={(e) =>
              setProfileForm({ ...profileForm, bio: e.target.value })
            }
          />
          <div className="form-actions">
            <button onClick={editProfile} className="btn-primary" disabled={!actor}>
              Save Changes
            </button>
            <button
              onClick={() => setShowEditProfile(false)}
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
          <button
            onClick={() => {
              setProfileForm({
                username: user?.username || "",
                bio: user?.bio || "",
              });
              setShowEditProfile(true);
            }}
            className="btn-secondary"
            disabled={!actor}
          >
            Edit Profile
          </button>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
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
                  <div className="post-header">
                    <h3>
                      {allUsers.find(([id]) => id.toText() === post.author.toText())?.[1]
                        ?.username || "Unknown User"}
                    </h3>
                    {post.author.toText() === principal.toText() && (
                      <button
                        onClick={() => deletePost(post.id)}
                        className="btn-danger"
                        disabled={!actor}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="post-content">{post.content}</p>
                  <div
                    className="post-actions"
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <button
                        onClick={() => likePost(post.id)}
                        className="like-btn"
                        disabled={!actor}
                      >
                        👍 {post.likes.length}
                      </button>
                      <button
                        onClick={() => unlikePost(post.id)}
                        className="unlike-btn"
                        disabled={!actor}
                      >
                        👎 Unlikes
                      </button>
                    </div>
                    <span style={{ fontSize: "0.90rem" }}>
                      {new Date(
                        Number(post.timestamp) / 1000000
                      ).toLocaleString()}
                    </span>
                  </div>

                  <div className="comments-section">
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="toggle-comments"
                      disabled={!actor}
                    >
                      {showComments[post.id]
                        ? "Hide Comments"
                        : "Show Comments"}
                    </button>
                    {showComments[post.id] && (
                      <div className="comments">
                        {comments
                          .filter((comment) => comment.post_id === post.id)
                          .map((comment, commentIndex) => (
                            <>
                              <div
                                key={commentIndex}
                                className="comment"
                                style={{
                                  display: "flex",
                                  justifyContent: "space_between",
                                  fontSize: "1rem",
                                }}
                              >
                                <div>
                                  <strong>
                                    {allUsers.find(
                                      ([id]) => id.toText() === comment.author.toText()
                                    )?.[1]?.username || "Unknown User"}
                                    :
                                  </strong>{" "}
                                  {comment.content}
                                </div>
                                <span style={{ fontSize: "0.90rem" }}>
                                  {new Date(
                                    Number(comment.timestamp) / 1000000
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <hr />
                            </>
                          ))}
                        <div className="add-comment">
                          <input
                            placeholder="Add a comment..."
                            value={newCommentContent}
                            onChange={(e) =>
                              setNewCommentContent(e.target.value)
                            }
                            type="text"
                          />
                          <button
                            onClick={() => addComment(post.id)}
                            className="btn-primary"
                            style={{
                              height:"3.1rem",
                              marginTop:"1rem"
                            }}
                            disabled={!actor}
                          >
                            Comment
                          </button>
                        </div>
                      </div>
                    )}
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
            <button onClick={createPost} className="btn-primary" disabled={!actor}>
              Post
            </button>
          </div>
        )}

        {activeTab === "users" && (
          <div className="users">
            <h2>All Users</h2>
            {allUsers.map(([userPrincipal, userData]) => {
              const isFollowing = user?.following?.includes(userPrincipal) || false;
              const isCurrentUser = userPrincipal.toText() === principal.toText();

              return (
                <div key={userPrincipal.toText()} className="user-card">
                  <h3>{userData.username}</h3>
                  <p>{userData.bio}</p>
                  <p>Followers: {userData.followers.length}</p>
                  {!isCurrentUser && (
                    <button
                      onClick={() =>
                        isFollowing
                          ? unfollowUser(userPrincipal)
                          : followUser(userPrincipal)
                      }
                      className={isFollowing ? "btn-danger" : "btn-secondary"}
                      disabled={!actor}
                    >
                      {isFollowing ? "Unfollow" : "Follow"}
                    </button>
                  )}
                  {isCurrentUser && (
                    <span className="current-user-label">You</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;