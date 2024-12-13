import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

export const addUser = async (id, name, email) => {
  await addDoc(collection(db, "users"), {
    id,
    name,
    email,
    createdAt: new Date(),
  });
};