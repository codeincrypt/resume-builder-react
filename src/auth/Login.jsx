import React, {useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { useGoogleLogin } from "@react-oauth/google";
import { Col, Row, Button } from "antd";
import { FaGoogle } from "react-icons/fa"
;
import { login } from "../store/slices/authSlice";
import { loginUser } from "../database/request";

const Login = () => {
  const [user, setUser] = useState([]);
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const getLogin = useGoogleLogin({
    onSuccess: (codeResponse) => setUser(codeResponse),
    onError: (error) => console.log("Login Failed:", error),
  });
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`,{
          headers: {
            Authorization: `Bearer ${user.access_token}`,
            Accept: "application/json",
          },
        });
        const data = await response.json();
        if(data.error) {
          console.error("Error fetching profile:", data.error);
          return;
        }
        const {uuid} = await loginUser(data.id, data.name, data.email, data.given_name, data.family_name, data.picture)
        dispatch(login({...data, uuid}))
        navigate("/home")
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
  
    if (user) {
      fetchProfile();
    }
  }, [user]);

  return (
    <Row justify="center" align="middle" style={{ minHeight: "80vh" }}>
      <Col span={24} style={{ textAlign: "center" }}>
        <Row justify="center">
          <Col span={12}>
            <h1 className="heading1">Log In</h1>
          </Col>
          <Col span={16}>
            <p className="paragraph2">We are happy to see you back!</p>
            <Button
              danger
              size="large"
              type="primary"
              icon={<FaGoogle />}
              className="btn-large"
              onClick={() => getLogin()}
            >
              Google
            </Button>
            <p className="paragraph2">I am not registered — Sign Up</p>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default Login;
