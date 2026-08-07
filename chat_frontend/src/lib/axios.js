// import axios from "axios";

// export const axiosInstance = axios.create({
//   // baseURL: "http://192.168.0.102:5001/api", // 
//   // baseURL: "http://192.168.45.189:5001/api", // cma 
// //  baseURL: "http://192.168.47.72:5001/api", //cma cu hall
//   // baseURL: "http://192.168.45.84:5001/api", //cma Ayeyar hostel
//   // baseURL: "http://192.168.0.235:5001/api", //cma AGB 1902 Room

//     baseURL: "http://172.19.8.32:5001/api", //cma AGB 1902 Room
  

  
  
//   //Change from an absolute URL to a relative one local host
//   // baseURL:
//   //   (import.meta.env.MODE === "development" && "http://localhost:5001/api") ||
//   //   "/api",

//   withCredentials: true,
// });
import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ""}/api`,
  withCredentials: true,
});