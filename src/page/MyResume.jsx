import React, { useEffect } from 'react'
import Resume from './Resume'
import { useDispatch, useSelector } from 'react-redux';
import { updateResume } from '../store/slices/resumeSlice';
import { getResume } from '../database/request';

const MyResume = () => {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.user?.id); // Assuming user ID is in auth state
  const resumeData = useSelector((state) => state.resume.data);

  const fetchResumeFromAPI = (user_id) => {
    const response = getResume(user_id)
    return response
  }

  useEffect(() => {
    if (!resumeData && userId) {
      const fetchData = async () => {
        try {
          const response = await fetchResumeFromAPI(userId); // API call function
          if(response === null) {
            // return SiAwselasticloadbalancing(false)
          }
          console.log("response", response)
          // dispatch(updateResume(response)); // Dispatch action to set data in Redux
        } catch (error) {
          console.error('Error fetching resume data:', error);
        }
      };
      fetchData();
    }
  }, [resumeData, userId, dispatch]);

  if (!resumeData) {
    return <p>Loading...</p>; // Display a loading message while fetching data
  }

  return (
    <div>
      <h1>My Resume</h1>
      <Resume data={resumeData} />
    </div>
  )
}

export default MyResume
