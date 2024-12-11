import React from 'react';
import { Descriptions } from 'antd';
const items = [
  {
    key: '1',
    label: 'UserName',
    children: 'Zhou Maomao',
  },
  {
    key: '2',
    label: 'Telephone',
    children: '1810000000',
  },
  {
    key: '3',
    label: 'Live',
    children: 'Hangzhou, Zhejiang',
  },
  {
    key: '4',
    label: 'Remark',
    children: 'empty',
  },
  {
    key: '5',
    label: 'Address',
    children: 'No. 18, Wantang Road, Xihu District, Hangzhou, Zhejiang, China',
  },
];
const Profile = () => {
  return (
    <React.Fragment>
      <Descriptions title="Basic Information" layout="vertical" bordered>
        {items.map((item) => (
          <Descriptions.Item label={item.label}>{item.children}</Descriptions.Item>
        ))}
      </Descriptions>
      <Descriptions title="Basic Information" layout="vertical" bordered />
      <Descriptions title="User Info" items={items} />
    </React.Fragment>
  );
};

export default Profile