import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { Link } from "react-router-dom";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
console.log(onlineUsers)
  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          
                <Link to={"/friend"} >
                <div className="avatar ">
            <div className="size-10 rounded-full relative bg-primary ">
              {selectedUser.profilePic ? (
                <img
                  src={selectedUser.profilePic}
                  alt={selectedUser.fullName}
                />
              ) : (
                <p className="w-10 h-10 rounded-full bg-primary flex items-center
                 justify-center text-primary-content font-medium text-xl text-center">
                {selectedUser.fullName.split(" ")[0][0].toUpperCase()}

                </p>
              )}
            </div>
          </div>
                </Link>
              
         

          {/* User info */}
          <div className="relative">
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            {console.log(selectedUser)}
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
              
            </p>
            {onlineUsers.includes(selectedUser._id) ? (
                <span
                  className="absolute bottom-0.5 left-11 size-3 bg-green-500 
                  rounded-full  "
                />
              ):(
                <span
                  className="absolute bottom-0.5 left-11 size-3 bg-gray-300 
                  rounded-full  "
                />
              )}
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedUser(null)}>
          <X />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;
