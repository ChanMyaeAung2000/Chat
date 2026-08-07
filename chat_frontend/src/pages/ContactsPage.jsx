import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Search, Users } from "lucide-react";

const ContactsPage = () => {
  const { getFriends, friends, addFriend, setSelectedUser, isFriendsLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    getFriends();
  }, [getFriends]);

  const filteredFriends = friends
    .filter((user) => (showOnlineOnly ? onlineUsers.includes(user._id) : true))
    .filter((user) =>
      user.fullName?.toLowerCase().includes(search.trim().toLowerCase())
    );

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setIsAdding(true);
    const success = await addFriend(newEmail.trim());
    setIsAdding(false);

    if (success) {
      setNewEmail("");
    }
  };

  const handleSelect = (user) => {
    setSelectedUser(user);
    navigate("/friend");
  };

  const getInitial = (name) => name?.trim()?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="min-h-screen pt-20 bg-base-200">
      <div className="max-w-4xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Contacts</h1>
              <p className="text-sm text-base-content/60">
                {friends.length} contact{friends.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {/* Add new friend form */}
          <form onSubmit={handleAddFriend} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="Enter friend's email to add"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 input input-bordered rounded-xl"
              required
            />
            <button
              type="submit"
              className="btn btn-primary rounded-xl"
              disabled={isAdding || !newEmail.trim()}
            >
              {isAdding ? "Adding..." : "Add Friend"}
            </button>
          </form>

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center text-base-content/40">
                <Search className="size-5" />
              </span>
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full input input-bordered pl-10 rounded-xl"
              />
            </div>

            <label className="cursor-pointer flex items-center gap-2 shrink-0">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Online only</span>
            </label>
          </div>

          {/* List */}
          {isFriendsLoading ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 bg-base-100 rounded-xl"
                >
                  <div className="skeleton size-12 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-32" />
                    <div className="skeleton h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center text-base-content/50 py-12">
              No contacts yet. Add a friend above.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filteredFriends.map((user) => {
                const isOnline = onlineUsers.includes(user._id);

                return (
                  <button
                    key={user._id}
                    onClick={() => handleSelect(user)}
                    className="flex items-center gap-3 p-4 bg-base-100 rounded-xl
                      hover:bg-base-200 hover:ring-1 hover:ring-primary/30
                      transition-all text-left"
                  >
                    <div className="relative shrink-0">
                      {user.profilePic ? (
                        <img
                          src={user.profilePic}
                          alt={user.fullName}
                          className="size-12 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="size-12 rounded-full bg-primary flex items-center
                            justify-center text-primary-content font-medium text-xl"
                        >
                          {getInitial(user.fullName)}
                        </div>
                      )}

                      {isOnline && (
                        <span
                          className="absolute bottom-0 right-0 size-3 bg-green-500
                            rounded-full ring-2 ring-base-100"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-medium truncate">{user.fullName}</div>
                      <div className="text-sm text-base-content/60 truncate">
                        {user.email}
                      </div>
                      <div
                        className={`text-xs ${
                          isOnline ? "text-green-500" : "text-base-content/40"
                        }`}
                      >
                        {isOnline ? "Online" : "Offline"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactsPage;
