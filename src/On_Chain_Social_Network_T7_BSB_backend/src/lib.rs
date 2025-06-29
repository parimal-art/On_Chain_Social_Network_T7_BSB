use ic_cdk::api::caller;
use ic_cdk_macros::{query, update};
use std::cell::RefCell;
use std::collections::HashMap;
use candid::{CandidType, Deserialize};

// ===== Data Models =====

#[derive(Clone, Debug, CandidType, Deserialize)]
struct User {
    username: String,
    bio: String,
    followers: Vec<String>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
struct Post {
    id: u64,
    content: String,
    author: String,
    timestamp: u64,
}

// ===== State =====

thread_local! {
    static USERS: RefCell<HashMap<String, User>> = RefCell::new(HashMap::new());
    static POSTS: RefCell<Vec<Post>> = RefCell::new(Vec::new());
    static POST_ID_COUNTER: RefCell<u64> = RefCell::new(0);
}

// ===== Update Methods =====

#[update]
fn create_user(username: String, bio: String) {
    let id = caller().to_text();
    let user = User {
        username,
        bio,
        followers: Vec::new(),
    };
    USERS.with(|users| {
        users.borrow_mut().insert(id, user);
    });
}

#[update]
fn create_post(content: String) {
    let author = caller().to_text();
    let timestamp = ic_cdk::api::time(); // in nanoseconds
    let new_post = POSTS.with(|posts| {
        POST_ID_COUNTER.with(|counter| {
            let mut count = counter.borrow_mut();
            let post = Post {
                id: *count,
                content,
                author,
                timestamp,
            };
            *count += 1;
            posts.borrow_mut().push(post.clone());
            post
        })
    });
    ic_cdk::println!("Post created: {:?}", new_post);
}

#[update]
fn follow_user(target_principal: String) {
    let follower = caller().to_text();
    USERS.with(|users| {
        let mut db = users.borrow_mut();
        if let Some(user) = db.get_mut(&target_principal) {
            if !user.followers.contains(&follower) {
                user.followers.push(follower);
            }
        }
    });
}

// ===== Query Methods =====

#[query]
fn get_user() -> Option<User> {
    let id = caller().to_text();
    USERS.with(|users| users.borrow().get(&id).cloned())
}

#[query]
fn get_all_users() -> Vec<(String, User)> {
    USERS.with(|users| users.borrow().iter().map(|(id, u)| (id.clone(), u.clone())).collect())
}

#[query]
fn get_feed() -> Vec<Post> {
    let caller_id = caller().to_text();
    let followed_authors = USERS.with(|users| {
        users.borrow()
            .get(&caller_id)
            .map(|user| user.followers.clone())
            .unwrap_or_else(Vec::new)
    });

    POSTS.with(|posts| {
        posts
            .borrow()
            .iter()
            .filter(|post| followed_authors.contains(&post.author))
            .cloned()
            .collect()
    })
}
