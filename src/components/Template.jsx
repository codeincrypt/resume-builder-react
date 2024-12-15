import React from "react";
import { Row, Col } from "antd";
import { resumeTemplate } from "./Constant";

const Template = ({ selectTemplate }) => {
  return (
    <Row gutter={[20, 20]}>
      {resumeTemplate.map((item, index) => (
        <Col span={8} key={item.id} onClick={(e) => selectTemplate(item)}>
          <img style={{ width: "100%" }} src={item.url} />
          <h1> {item.name} </h1>
        </Col>
      ))}
    </Row>
  );
};
export default Template;
