import React from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Image, Button } from "antd";

const Home = () => {
  const navigate = useNavigate();

  return (
    <Row
      justify="center"
      align="middle"
      style={{ minHeight: "95vh", padding: "20px" }}
      gutter={[16, 16]} // Adds spacing between grid items
    >
      <Col
        xs={24} // Full width on extra small screens
        sm={24} // Full width on small screens
        md={10} // 10-column width on medium screens
        lg={9} // 9-column width on large screens
      >
        <div className="jumbotron-header">
          <div className="page-title">
            <p className="paragraph">Many resumes created today</p>
            <h1 className="heading1">The professional resume builder</h1>
            <p className="paragraph">
              Only 2% of resumes win. Yours will be one of them. Let's build you
              a resume that works.
            </p>
            <Button
              size="large"
              type="primary"
              className="btn-large"
              onClick={() => navigate("/create-resume")}
              style={{ width: "100%", maxWidth: "300px" }} // Ensures good button scaling
            >
              Create My Resume
            </Button>
          </div>
        </div>
      </Col>

      <Col xs={24} sm={24} md={10} lg={9} style={{ marginTop: "20px", textAlign: "center" }}>
        <div className="jumbotron-footer text-center jumbotron-hiw">
          <Image
            preview={false}
            alt="resume-builder"
            src="https://res.cloudinary.com/dpevovkcg/image/upload/v1733568218/resume-builder/om01qtvtcvi3fwcnad4a.png"
            style={{ maxWidth: "100%", height: "auto" }} // Scales image on smaller screens
          />
        </div>
      </Col>
    </Row>
  );
};

export default Home;