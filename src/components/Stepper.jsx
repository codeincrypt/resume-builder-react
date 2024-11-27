import React from "react";
import { Steps } from "antd";

const Stepper = ({ current }) => {
  const steps = [
    {
      title: "Select Template",
      content: "",
    },
    {
      title: "Add your details",
      content: "",
    },
    {
      title: "Update your profile",
      content: "",
    },
  ];

  const items = steps.map((item) => ({
    key: item.title,
    title: item.title,
  }));
  return (
    <>
      <h1>current - {current} </h1>
      <Steps current={current} items={items} />
    </>
  );
};
export default Stepper;
