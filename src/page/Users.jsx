import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { Form, Row, Col, Input, Button } from "antd";

import Stepper from "../components/Stepper";

const Users = () => {
  const [current, setCurrent] = useState(1);
  // const user = useSelector((state) => state.user);
  const [uuid] = useState(uuidv4());
  const dispatch = useDispatch();

  const [form] = Form.useForm();
  const variant = Form.useWatch("variant", form);

  const initialValue = {
    fname: "",
    lname: "",
    email: "",
    jobtitle: "",
    phone: "",
    country: "",
    city: "",
    address: "",
    postalcode: "",
    nationality: "",
    dob: "",
  };
  const [formData, setFormData] = useState(initialValue);

  const handleStep2 = (values) => {
    const data = {
      ...values,
      uuid,
    };
    console.log("data2", data);
    setFormData({
      ...formData,
    });
    setCurrent(1);
  };

  const handleStep3 = (values) => {
    const data = {
      ...values,
      uuid,
    };
    console.log("data3", data);
    setCurrent(2);
  };

  const goBack = (e) => {
    setCurrent(e);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Row justify="center">
        <Col span={16}>
          <Stepper current={current} />
        </Col>
        <Col span={16}>
          {current === 0 ? (
            <Row justify="center">
              <Col span={20} className="text-center">
                <h1 className="heading1 text-center">Add your name</h1>
                <p className="text-center">
                  You made a great template selection! Now let’s add your name
                  to it.
                </p>
              </Col>
              <Col span={16}>
                <Form
                  form={form}
                  initialvalue={initialValue}
                  variant={variant || "filled"}
                  onFinish={(values) => handleStep2(values)}
                  layout="vertical"
                >
                  <Form.Item
                    label="First Name"
                    name="fname"
                    rules={[{ message: "Please input!" }]}
                  >
                    <Input className="form-control" />
                  </Form.Item>
                  <Form.Item
                    label="Last Name"
                    name="lname"
                    rules={[{ message: "Please input!" }]}
                  >
                    <Input className="form-control" />
                  </Form.Item>
                  <Form.Item
                    label="Email Id"
                    name="email"
                    rules={[{ message: "Please input!" }]}
                  >
                    <Input className="form-control" />
                  </Form.Item>
                  <Row justify={"space-between"}>
                    <Button>Back</Button>
                    <Button htmlType="submit" type="primary">
                      Next
                    </Button>
                  </Row>
                </Form>
              </Col>
            </Row>
          ) : null}
          {current === 1 ? (
            <Row justify="center">
              <Col span={20}>
                <h2>Personal details</h2>
                <Form
                  form={form}
                  variant={variant || "filled"}
                  initialvalue={initialValue}
                  onFinish={(values) => handleStep3(values)}
                  layout="vertical"
                >
                  <Row gutter={[16, 0]}>
                    <Col span={24}>
                      <Form.Item
                        label="Job Title"
                        name="jobtitle"
                        rules={[{ message: "Please input!" }]}
                      >
                        <Input className="form-control" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="First Name"
                        name="fname"
                        rules={[{ message: "Please input!" }]}
                      >
                        <Input className="form-control" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Last Name"
                        name="lname"
                        rules={[{ message: "Please input!" }]}
                      >
                        <Input className="form-control" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Email Id"
                        name="email"
                        rules={[{ message: "Please input!" }]}
                      >
                        <Input className="form-control" />
                      </Form.Item>
                    </Col>
                    <Col span={12}></Col>
                  </Row>
                  <Row justify={"space-between"}>
                    <Button onClick={(e) => goBack(0)}>Back</Button>
                    <Button htmlType="submit" type="primary">
                      Next
                    </Button>
                  </Row>
                </Form>
              </Col>
            </Row>
          ) : null}
        </Col>
      </Row>
    </div>
  );
};

export default Users;
