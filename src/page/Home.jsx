import React from "react";
import { useNavigate } from "react-router-dom";

import { Row, Col, Image, Button } from "antd";

const Home = () => {
  const navigate = useNavigate();
  return (
    <Row justify="center" align="middle" style={{ minHeight: "80vh" }}>
      <div className="page-hiw">
        <Row justify="center">
          <Col span={9}>
            <div className="jumbotron-header">
              <div className="page-title">
              <p className="paragraph">Many resumes created today</p>
                <h1 className="heading1">The professional resume builder</h1>
                <p className="paragraph">
                  Only 2% of resumes win. Yours will be one of them. Let's build
                  you a resume that works.
                </p>
                <Button
                  size="large"
                  type="primary"
                  className="btn-large"
                  onClick={() => navigate("/create-resume")}
                >
                  Create My Resume
                </Button>
              </div>
            </div>
          </Col>

          <Col span={2}></Col>

          <Col span={9} style={{ marginTop: "50px" }}>
            <div className="jumbotron-footer text-center jumbotron-hiw">
              <Image
                preview={false}
                alt="resume-builder"
                src="https://res.cloudinary.com/dpevovkcg/image/upload/v1733568218/resume-builder/om01qtvtcvi3fwcnad4a.png"
              />
            </div>
          </Col>
        </Row>
      </div>
    </Row>
  );
};

export default Home;
