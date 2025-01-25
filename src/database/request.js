import { collection, addDoc, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { v4 as uuidv4 } from "uuid";

export const loginUser = async (id, name, email, given_name, family_name, picture) => {
  try {
    const userCollection = collection(db, "users");

    // Check if the user exists
    const userQuery = query(userCollection, where("email", "==", email));
    const querySnapshot = await getDocs(userQuery);

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();

      return {
        uuid: userData.uuid,
        id: userData.id,
        name: userData.name,
        email: userData.email,
        given_name: userData.given_name,
        family_name: userData.family_name,
        picture: userData.picture,
        message: "User fetched from database",
      };
    } else {
      const uuid = uuidv4()
      await addDoc(userCollection, {
        uuid, id, name, email, given_name, family_name, picture,
        createdAt: new Date(),
      });

      return {
        uuid, id, name, email, given_name, family_name, picture,
        message: "New user registered successfully",
      };
    }
  } catch (error) {
    console.error("Error in Adding or Fetching User", error);
    throw error;
  }
};


export const updateResume = async (user_id, resume_data) => {
  try {
    const exist_data = await getResume(user_id)
    const resumeCollection = collection(db, "resumes");

    if (exist_data) {
      const userQuery = query(resumeCollection, where("user_id", "==", user_id));
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        await updateDoc(doc(db, "resumes", docId), {
          resume: resume_data,
          updatedAt: new Date(),
        });
      }
    } else {
      const uuid = uuidv4()
      const data = {
        user_id: user_id,
        uuid: uuid,
        resume: resume_data,
        updatedAt: new Date(),
      };
      const docRef = await addDoc(collection(db, "resumes"), data);
      console.log("Document written with ID: ", docRef.id);
    }
  } catch (error) {
    console.error("Error in updating resume data", error);
    throw error;
  }
};


export const getResume = async (user_id) => {
  try {
    const resumeCollection = collection(db, "resumes");
    const userQuery = query(resumeCollection, where("user_id", "==", user_id));
    const querySnapshot = await getDocs(userQuery);
    if (!querySnapshot.empty) {
      const resumeData = querySnapshot.docs[0].data();
      return resumeData
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error in getting resume data", error);
    throw error;
  }
}
