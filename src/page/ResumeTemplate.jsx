import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Row, Col, Button } from "antd";

import Template from "../components/Template";

const ResumeTemplate = () => {
  const [template, setTemplate] = useState("");
  const navigate = useNavigate();
  const selectTemplate = (e) => {
    setTemplate(e);
    setCurrent(1);
  };

  return (
    <div className="page-hiw">
      <Row justify="center">
        <Col span={20}>
          <Row justify="center">
            <Col span={12}>
              <h1 className="heading1 text-center">
                Job-winning resume templates
              </h1>
            </Col>
            <Col span={16} className="text-center">
              <p className="paragraph">
                Each resume template is designed to follow the exact rules you
                need to get hired faster. Use our resume templates and get free
                access to 18 more career tools!
              </p>
              <Button
                size="large"
                type="primary"
                className="btn-large"
                onClick={() => navigate("/create-resume")}
              >
                Create My Resume
              </Button>
            </Col>

            <Col span={20} style={{ marginTop: "50px" }}>
              <Template selectTemplate={selectTemplate} />
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default ResumeTemplate;