import React from "react";
import { Row, Col, Image } from "antd";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  return (
    <div>
      <div className="page-hiw">
        <Row justify="center">
          <Col span={8}>
            <div className="jumbotron-header">
              <div className="page-title">
                <p>Many resumes created today</p>
                <h1 className="heading1">The professional resume builder</h1>
                <p className="paragraph">
                  Only 2% of resumes win. Yours will be one of them. Let´s build
                  you a resume that works.
                </p>
                <button
                  type="primary"
                  onClick={() => navigate("/resume-template")}
                  className="main-btn"
                >
                  Create My Resume
                </button>
              </div>
            </div>
          </Col>

          <Col span={2}></Col>

          <Col span={8} style={{ marginTop: "50px" }}>
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
    </div>
  );
};

export default Home;
