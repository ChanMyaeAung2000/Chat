import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  friends: [],
  chatUsers: [],
  selectedUser: null,
  isUsersLoading: false,
  isFriendsLoading: false,
  isChatUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getFriends: async () => {
    set({ isFriendsLoading: true });
    try {
      const res = await axiosInstance.get("/friends");
      set({ friends: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load contacts");
    } finally {
      set({ isFriendsLoading: false });
    }
  },

  addFriend: async (email) => {
    try {
      const res = await axiosInstance.post("/friends/add", { email });
      const newFriend = res.data.friend;
      const currentFriends = get().friends;
      if (!currentFriends.some((f) => f._id === newFriend._id)) {
        set({ friends: [...currentFriends, newFriend] });
      }
      toast.success("Friend added successfully", {
        icon: "👋",
        style: {
          borderRadius: "12px",
          background: "#1a1a2e",
          color: "#fff",
        },
      });
      return true;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to add friend";
      if (message.toLowerCase().includes("no exist") || message.includes("not found")) {
        toast.error("User not exist", {
          icon: "❌",
          style: {
            borderRadius: "12px",
            background: "#1a1a2e",
            color: "#fff",
          },
        });
      } else {
        toast.error(message, {
          style: {
            borderRadius: "12px",
            background: "#1a1a2e",
            color: "#fff",
          },
        });
      }
      return false;
    }
  },

  getChatUsers: async () => {
    set({ isChatUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chatUsers: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load chat list");
    } finally {
      set({ isChatUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  //for socket
  // deleteMessage : async (messageId) => {
  //   try {
  //     const res = await axiosInstance.delete(`/messages/delete/${messageId}`, {
  //       withCredentials: true, // cookie-based authentication
  //     });
  //     console.log(res.data);
  //   } catch (error) {
  //     console.error("Error deleting message:", error.response.data);
  //   }
  // },

  deleteMessage : async (messageId) => {
  try {
    const res = await axiosInstance.delete(`/messages/delete/${messageId}`, {
      withCredentials: true,
    });

    // Express response မှာ deletedMessageId ပေးထားမယ်
    const { deletedMessageId } = res.data;

    // DB က အောင်မြင်စွာ ဖျက်ပြီဆို frontend store မှာလည်း update လုပ်ပေး
    set({
      messages: get().messages.map(msg =>
        msg._id === deletedMessageId ? { ...msg, isDeleted: true } : msg
      ),
    });

  } catch (error) {
    console.error("Error deleting message:", error.response?.data || error.message);
  }
},

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
socket.on("messageDeleted", ({ messageId }) => {
  set({
    messages: get().messages.map(msg =>
      msg._id === messageId ? { ...msg, isDeleted: true } : msg
    ),
  });
});
  },
  

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messageDeleted");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
