// import User from "../models/user.model.js";
// import Message from "../models/message.model.js";

// import cloudinary from "../lib/cloudinary.js";
// import { getReceiverSocketId, io } from "../lib/socket.js";

// export const getUsersForSidebar = async (req, res) => {
//   try {
//     const loggedInUserId = req.user._id;
//     const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

//     res.status(200).json(filteredUsers);
//   } catch (error) {
//     console.error("Error in getUsersForSidebar: ", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// export const getMessages = async (req, res) => {
//   try {
//     const { id: userToChatId } = req.params;
//     const myId = req.user._id;

//     const messages = await Message.find({
//       $or: [
//         { senderId: myId, receiverId: userToChatId },
//         { senderId: userToChatId, receiverId: myId },
//       ],
//     });

//     res.status(200).json(messages);
//   } catch (error) {
//     console.log("Error in getMessages controller: ", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// export const sendMessage = async (req, res) => {
//   try {
//     const { text, image } = req.body;
//     const { id: receiverId } = req.params;
//     const senderId = req.user._id;

//     let imageUrl;
//     if (image) {
//       // Upload base64 image to cloudinary
//       const uploadResponse = await cloudinary.uploader.upload(image);
//       imageUrl = uploadResponse.secure_url;
//     }

//     const newMessage = new Message({
//       senderId,
//       receiverId,
//       text,
//       image: imageUrl,
//     });

//     await newMessage.save();

//     const receiverSocketId = getReceiverSocketId(receiverId);
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("newMessage", newMessage);
//     }

//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.log("Error in sendMessage controller: ", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
// // export const deleteMessage = async (req, res) => {
// //   try {
// //     const { id } = req.params; // message id
// //     const userId = req.user._id; // logged-in user

// //     // find the message
// //     const message = await Message.findById(id);

// //     if (!message) {
// //       return res.status(404).json({ message: "Message not found" });
// //     }

// //     // Only sender can delete their own message
// //     if (message.senderId.toString() !== userId.toString()) {
// //       return res.status(403).json({ message: "You can only delete your own messages" });
// //     }

// //     await message.deleteOne();

// //     res.status(200).json({ message: "Message deleted successfully", deletedMessageId: id });
// //   } catch (error) {
// //     console.log("Error in deleteMessage controller:", error.message);
// //     res.status(500).json({ error: "Internal server error" });
// //   }
// // };
// export const deleteMessage = async (req, res) => {
//   try {
//     const { id } = req.params; // message id
//     const userId = req.user._id; // logged-in user

//     const message = await Message.findById(id);
//     if (!message) {
//       return res.status(404).json({ message: "Message not found" });
//     }

//     // Only sender can delete their own message
//     if (message.senderId.toString() !== userId.toString()) {
//       return res.status(403).json({ message: "You can only delete your own messages" });
//     }

//     // ✅ Soft delete (mark as deleted instead of removing)
//     message.isDeleted = true;
//     await message.save();

//     // --- Emit to receiver ---
//     const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("messageDeleted", { messageId: id });
//     }

//     // --- Emit to sender too ---
//     const senderSocketId = getReceiverSocketId(userId.toString());
//     if (senderSocketId) {
//       io.to(senderSocketId).emit("messageDeleted", { messageId: id });
//     }

//     res.status(200).json({ 
//       message: "Message deleted successfully", 
//       deletedMessageId: id 
//     });
//   } catch (error) {
//     console.log("Error in deleteMessage controller:", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
// deleting for mongo
// export const deleteMessage = async (req, res) => {
//   try {
//     const { id } = req.params; // message id
//     const userId = req.user._id; // logged-in user

//     // find the message
//     const message = await Message.findById(id);

//     if (!message) {
//       return res.status(404).json({ message: "Message not found" });
//     }

//     // Only sender can delete their own message
//     if (message.senderId.toString() !== userId.toString()) {
//       return res.status(403).json({ message: "You can only delete your own messages" });
//     }

//     await message.deleteOne();

//     res.status(200).json({ message: "Message deleted successfully", deletedMessageId: id });
//   } catch (error) {
//     console.log("Error in deleteMessage controller:", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

//deleting for socket
// export const deleteMessage = async (req, res) => {
//   try {
//     const { id } = req.params; // message id
//     const userId = req.user._id; // logged-in user

//     const message = await Message.findById(id);
//     if (!message) {
//       return res.status(404).json({ message: "Message not found" });
//     }

//     // Only sender can delete their own message
//     if (message.senderId.toString() !== userId.toString()) {
//       return res.status(403).json({ message: "You can only delete your own messages" });
//     }

//     // ✅ Soft delete (mark as deleted instead of removing)
//     message.isDeleted = true;
//     await message.save();

//     // --- Emit to receiver ---
//     const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("messageDeleted", { messageId: id });
//     }

//     // --- Emit to sender too ---
//     const senderSocketId = getReceiverSocketId(userId.toString());
//     if (senderSocketId) {
//       io.to(senderSocketId).emit("messageDeleted", { messageId: id });
//     }

//     res.status(200).json({ 
//       message: "Message deleted successfully", 
//       deletedMessageId: id 
//     });
//   } catch (error) {
//     console.log("Error in deleteMessage controller:", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the message
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only sender can delete
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    // ❌ Option 1: Hard delete
    // await message.deleteOne();

    // ✅ Option 2: Soft delete (recommended for showing "This message was deleted")
    message.isDeleted = true;
    await message.save();

    // --- Emit to receiver ---
    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", { messageId: id });
    }

    // --- Emit to sender too ---
    const senderSocketId = getReceiverSocketId(userId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", { messageId: id });
    }

    res.status(200).json({
      message: "Message deleted successfully",
      deletedMessageId: id,
    });
  } catch (error) {
    console.log("Error in deleteMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};