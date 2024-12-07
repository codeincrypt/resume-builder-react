import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { Form, Row, Tag, Col, Input, Button, Space, DatePicker } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
const { TextArea } = Input;
import Stepper from "../components/Stepper";
import { itSkills } from "../components/Constant";

const CreateResume = () => {
  const [current, setCurrent] = useState(0);
  const [template, setTemplate] = useState("");
  const [skills, setSkills] = useState(itSkills);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const user = useSelector((state) => state.user);
  const [uuid] = useState(uuidv4());
  const dispatch = useDispatch();

  const [form] = Form.useForm();
  const variant = Form.useWatch("variant", form);

  const datepickerConfig = {
    rules: [
      {
        type: "object",
        required: true,
        message: "Please select time!",
      },
    ],
  };

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

  const handleStep1 = (values) => {
    const data = {
      ...values,
      skills: selectedSkills,
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
      // startdate: values["startdate"].format("YYYY-MM-DD"),
      uuid,
    };
    console.log("data3", data);
    setCurrent(2);
  };

  const goBack = (e) => setCurrent(e);

  const selectSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
    setSelectedSkills([...selectedSkills, skill]);
  };

  const removeSelectedSkill = (skill) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    setSkills([...skills, skill]);
  };

  useEffect(() => {
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
                  onFinish={(values) => handleStep1(values)}
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
                <Form
                  form={form}
                  variant={variant || "filled"}
                  initialvalue={initialValue}
                  onFinish={(values) => handleStep3(values)}
                  layout="vertical"
                >
                  <Row gutter={[16, 0]}>
                    <Col span={24}>
                      <h2>Personal details</h2>
                    </Col>
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
                    <Col span={12}>
                      <Form.Item
                        label="Phone"
                        name="phone"
                        rules={[{ message: "Please input!" }]}
                      >
                        <Input className="form-control" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Country"
                        name="country"
                        rules={[{ message: "Please input!" }]}
                      >
                        <Input className="form-control" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="City"
                        name="city"
                        rules={[{ message: "Please input!" }]}
                      >
                        <Input className="form-control" />
                      </Form.Item>
                    </Col>
                    <Col span={12}></Col>
                  </Row>
                  <Col span={24}>
                    <h2>Professional Summary</h2>
                  </Col>

                  <Col span={24}>
                    <Form.Item
                      label="Summary"
                      name="summary"
                      rules={[
                        { message: "Please input professional summary!" },
                      ]}
                    >
                      <TextArea
                        // value={value}
                        // onChange={(e) => setValue(e.target.value)}
                        autoSize={{ minRows: 3, maxRows: 5 }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <h2>Employment History</h2>
                    <p>
                      Show your relevent experience. Use bullet pont to note
                      your achievement, If possible - use number/facts (Achieve
                      X, measured by Y, by doing Z)
                    </p>
                  </Col>

                  <Col span={24}>
                    <Form.List name="employment">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map(({ key, name, ...restField }) => (
                            <Space
                              key={key}
                              style={{ display: "flex", marginBottom: 8 }}
                              align="baseline"
                            >
                              <Row>
                                <Col span={24}>
                                  <p> {JSON.stringify(restField)} </p>
                                  <Row justify="space-between">
                                    <h2>({restField?.jobtitle})</h2>
                                    <h2>
                                      <MinusCircleOutlined
                                        onClick={() => remove(name)}
                                      />
                                    </h2>
                                  </Row>
                                </Col>
                                <Col span={12}>
                                  <Form.Item
                                    {...restField}
                                    name={[name, "jobtitle"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: "Missing job title",
                                      },
                                    ]}
                                  >
                                    <Input placeholder="Job Title" />
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item
                                    {...restField}
                                    name={[name, "employer"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: "Missing employer name",
                                      },
                                    ]}
                                  >
                                    <Input placeholder="Employer" />
                                  </Form.Item>
                                </Col>
                                <Col span={6}>
                                  <Form.Item
                                    {...restField}
                                    name={[name, "startdate"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: "Missing start date",
                                      },
                                    ]}
                                    {...datepickerConfig}
                                  >
                                    <DatePicker />
                                  </Form.Item>
                                </Col>
                                <Col span={6}>
                                  <Form.Item
                                    {...restField}
                                    name={[name, "enddate"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: "Missing end date",
                                      },
                                    ]}
                                  >
                                    <DatePicker />
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item
                                    {...restField}
                                    name={[name, "city"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: "Missing City name",
                                      },
                                    ]}
                                  >
                                    <Input placeholder="City" />
                                  </Form.Item>
                                </Col>
                              </Row>
                            </Space>
                          ))}
                          <Form.Item>
                            <Button
                              type="dashed"
                              onClick={() => add()}
                              block
                              icon={<PlusOutlined />}
                            >
                              Add More Employment
                            </Button>
                          </Form.Item>
                        </>
                      )}
                    </Form.List>
                  </Col>

                  <Col span={24}>
                    <h2>Education</h2>
                    <p>Show your</p>
                  </Col>

                  <Col span={24}>
                    <Form.List name="education">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map(({ key, name, ...restField }) => (
                            <Space
                              key={key}
                              style={{ display: "flex", marginBottom: 8 }}
                              align="baseline"
                            >
                              <Row>
                                <Col span={24}>
                                  <p> {JSON.stringify(restField)} </p>
                                  <Row justify="space-between">
                                    <h2>({restField?.jobtitle})</h2>
                                    <h2>
                                      <MinusCircleOutlined
                                        onClick={() => remove(name)}
                                      />
                                    </h2>
                                  </Row>
                                </Col>
                                <Col span={12}>
                                  <Form.Item
                                    {...restField}
                                    name={[name, "school"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: "Missing job title",
                                      },
                                    ]}
                                  >
                                    <Input placeholder="School / College" />
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item
                                    {...restField}
                                    name={[name, "degree"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: "Missing employer name",
                                      },
                                    ]}
                                  >
                                    <Input placeholder="Degree" />
                                  </Form.Item>
                                </Col>
                                <Col span={6}>
                                  <Form.Item
                                    {...restField}
                                    name={[name, "startdate"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: "Missing start date",
                                      },
                                    ]}
                                    {...datepickerConfig}
                                  >
                                    <DatePicker />
                                  </Form.Item>
                                </Col>
                                <Col span={6}>
                                  <Form.Item
                                    {...restField}
                                    name={[name, "enddate"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: "Missing end date",
                                      },
                                    ]}
                                  >
                                    <DatePicker />
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item
                                    {...restField}
                                    name={[name, "city"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: "Missing City name",
                                      },
                                    ]}
                                  >
                                    <Input placeholder="City" />
                                  </Form.Item>
                                </Col>
                                <Col span={24}>
                                  <Form.Item
                                    {...restField}
                                    name={[name, "description"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: "Missing description",
                                      },
                                    ]}
                                  >
                                    <TextArea
                                      // value={value}
                                      // onChange={(e) => setValue(e.target.value)}
                                      autoSize={{ minRows: 3, maxRows: 5 }}
                                    />
                                  </Form.Item>
                                </Col>
                              </Row>
                            </Space>
                          ))}
                          <Form.Item>
                            <Button
                              type="dashed"
                              onClick={() => add()}
                              block
                              icon={<PlusOutlined />}
                            >
                              Add More Education
                            </Button>
                          </Form.Item>
                        </>
                      )}
                    </Form.List>
                  </Col>

                  <Col span={24}>
                    {skills.map((skill, index) => (
                      <Tag
                        key={index}
                        color="geekblue"
                        onClick={() => selectSkill(skill)}
                        style={{ cursor: "pointer" }}
                      >
                        {skill} <PlusOutlined />
                      </Tag>
                    ))}
                  </Col>

                  <Col>
                    {selectedSkills.map((skill, index) => (
                      <Tag
                        key={index}
                        color="green"
                        closable
                        onClose={() => removeSelectedSkill(skill)}
                      >
                        {skill}
                      </Tag>
                    ))}
                  </Col>

                  <Row justify={"space-between"}>
                    <Button onClick={(e) => goBack(1)}>Back</Button>
                    <Button htmlType="submit" type="primary">
                      Preview & Download
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

export default CreateResume;
