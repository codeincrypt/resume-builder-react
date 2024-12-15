import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export const loginUser = async (id, name, email, given_name, family_name, picture) => {
  try {
    const userCollection = collection(db, "users");

    // Check if the user exists
    const userQuery = query(userCollection, where("email", "==", email));
    const querySnapshot = await getDocs(userQuery);

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        given_name: userData.given_name,
        family_name: userData.family_name,
        picture: userData.picture,
        message: "User fetched from database",
      };
    }

    // If user doesn't exist, insert the user
    const response = await addDoc(userCollection, {
      id,
      name,
      email,
      given_name,
      family_name,
      picture,
      createdAt: new Date(),
    });

    return {
      id,
      name,
      email,
      given_name,
      family_name,
      picture,
      message: "New user registered successfully",
    };
  } catch (error) {
    console.error("Error in Adding or Fetching User", error);
    throw error;
  }
};


export const updateResume = async (user_id) => {
  // Update resume data
  try {
    const resumeCollection = collection(db, "resumes");

    const userQuery = query(resumeCollection, where("user_id", "==", user_id));
    const querySnapshot = await getDocs(userQuery);

    // If user doesn't exist, insert the user
    const response = await addDoc(resumeCollection, {
      user_id: user_id,
      resume_data: resume_data,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error in updating resume data", error);
    throw error;
  }
};


export const getResume = async (user_id) => {
  try {
    const userQuery = query(collection(db, "resumes"), where("user_id", "==", user_id));
    const querySnapshot = await getDocs(userQuery);
    if (!querySnapshot.empty) {
      const resumeData = querySnapshot.docs[0].data();
      return resumeData
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error in updating resume data", error);
    throw error;
  }
};