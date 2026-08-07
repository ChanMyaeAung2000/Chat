import User from "../models/user.model.js";

export const addFriend = async (req, res) => {
  try {
    const { email } = req.body;
    const myId = req.user._id;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const friend = await User.findOne({ email }).select("-password");

    if (!friend) {
      return res.status(404).json({ message: "User no exist" });
    }

    if (friend._id.toString() === myId.toString()) {
      return res.status(400).json({ message: "You cannot add yourself as a friend" });
    }

    const me = await User.findById(myId);

    const alreadyFriend = me.friends.some(
      (fid) => fid.toString() === friend._id.toString()
    );

    if (alreadyFriend) {
      return res.status(400).json({ message: "User is already in your contacts" });
    }

    me.friends.push(friend._id);
    await me.save();

    res.status(200).json({
      message: "Friend added successfully",
      friend,
    });
  } catch (error) {
    console.log("Error in addFriend controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFriends = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).populate("friends", "-password");
    res.status(200).json(me.friends || []);
  } catch (error) {
    console.log("Error in getFriends controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
