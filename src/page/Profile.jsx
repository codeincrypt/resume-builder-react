import React from "react";
import { useSelector } from "react-redux";
import { Descriptions } from "antd";

const Profile = () => {
  const user = useSelector((state) => state.auth.user);
  const items = [
    { key: "1", label: "Username", children: user.name },
    { key: "2", label: "First Name", children: user.given_name },
    { key: "3", label: "Last Name", children: user.family_name },
    { key: "4", label: "Email", children: user.email },
    { key: "5", label: "Phone", children: "" },
    { key: "6", label: "Address", children: "" },
  ];
  return (
    <React.Fragment>
      <Descriptions title="User Info" items={items} bordered />
    </React.Fragment>
  );
};

export default Profile;
