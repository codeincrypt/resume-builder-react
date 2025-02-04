import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Form,
  Row,
  Tag,
  Col,
  Input,
  Button,
  Space,
  DatePicker,
  Select,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

const { TextArea } = Input;

import Stepper from "../components/Stepper";
import {
  itSkills,
  datepickerConfig,
  itJobDesignations,
  initialValue,
} from "../components/Constant";
import { updateResume } from "../database/request";

const CreateResume = () => {
  const user = useSelector((state) => state.auth.user);
  const template = useSelector((state) => state.template);

  const [current, setCurrent] = useState(0);
  const [jobTitleData, setJobTitleData] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [skills, setSkills] = useState(itSkills);
  const [selectedSkills, setSelectedSkills] = useState([]);

  const dispatch = useDispatch();

  const [form] = Form.useForm();
  const variant = Form.useWatch("variant", form);

  let timeout;
  let currentValue;

  const fetch = (value, callback) => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    currentValue = value;
    const fake = () => {
      if (currentValue === value) {
        const filteredData = itJobDesignations
          .filter((item) => item.toLowerCase().includes(value.toLowerCase()))
          .map((item) => ({
            value: item,
            text: item,
          }));
        callback(filteredData);
      }
    };
    if (value) {
      timeout = setTimeout(fake, 300);
    } else {
      callback([]);
    }
  };

  const handleSearch = (newValue) => {
    fetch(newValue, setJobTitleData);
  };
	const handleChange = (newValue) => {
    setJobTitle(newValue);
  };

  const [formData, setFormData] = useState(initialValue);

  const handleStep1 = async (values) => {
    console.log("values", values);
    setFormData({
      ...formData,
    });
    await updateResume(user.uuid, values)
    setCurrent(1);
  };

  const handleStep3 = (values) => {
    const data = {
      ...values,
      jobTitle,
      skills: selectedSkills,
      // startdate: values["startdate"].format("YYYY-MM-DD"),
      uuid,
    };
    console.log("final- data", data);
    // setCurrent(2);
  };

  const Searchstyle = {
    borderRadius: 3,
    // padding: 12px 16px;
    width: "100%",
    display: "block",
    caretColor: "rgb(26, 145, 240)",
    backgroundColor: "rgb(239, 242, 249)",
    borderBottom:" 2px solid transparent",
    outline: "none",
    color: "rgb(30, 37, 50)",
    transition:" color 0.1s"
  }

  const goBack = (e) => setCurrent(e);

  const selectSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
    setSelectedSkills([...selectedSkills, skill]);
  };

  const removeSelectedSkill = (skill) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    setSkills([...skills, skill]);
  };

  useEffect(() => {}, []);

  return (
    <div>
      <Row justify="center">
        <Col span={16}>
          <Stepper current={current} />
          <p> template: {JSON.stringify(template)} </p>
        </Col>
        <Col span={16}>
          {current === 0 ? (
            <Row justify="center">
              <Col span={20} className="text-center">
                <h1 className="heading1 text-center">Add your name</h1>
                <p className="text-center paragraph-muted">
                  You made a great template selection! Now let's add your name
                  to it
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
                        <Select
                          showSearch
                          value={jobTitle}
                          defaultActiveFirstOption={false}
                          suffixIcon={null}
                          filterOption={false}
                          onSearch={handleSearch}
                          onChange={handleChange}
                          notFoundContent={null}
                          options={(jobTitleData || []).map((d) => ({
                            value: d.value,
                            label: d.text,
                          }))}
                        />
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
                    <p className="paragraph-muted">
                      Write 2-4 short, energetic sentences about how great you
                      are. Mention the role and what you did. What were the big
                      achievements? Describe your motivation and list your
                      skills.
                    </p>
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
                    <p className="paragraph-muted">
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
                              <Row gutter={[20, 20]}>
                                <Col span={24}>
                                  <Row justify="space-between">
                                    <h2>Title : </h2>
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
                                    <Input
                                      placeholder="Job Title"
                                      className="form-control"
                                    />
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
                                    <Input
                                      placeholder="Employer"
                                      className="form-control"
                                    />
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
                                    <DatePicker className="form-control" />
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
                                    <DatePicker className="form-control" />
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
                                    <Input
                                      placeholder="City"
                                      className="form-control"
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
                              Add More Employment
                            </Button>
                          </Form.Item>
                        </>
                      )}
                    </Form.List>
                  </Col>

                  <Col span={24}>
                    <h2>Education</h2>
                    <p className="paragraph-muted">
                      A varied education on your resume sums up the value that
                      your learnings and background will bring to job.
                    </p>
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
                              <Row gutter={[20, 20]}>
                                <Col span={24}>
                                  <p> {JSON.stringify(restField)} </p>
                                  <Row justify="space-between">
                                    <h2>Title : </h2>
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
                                    <Input
                                      placeholder="School / College"
                                      className="form-control"
                                    />
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
                                    <Input
                                      placeholder="Degree"
                                      className="form-control"
                                    />
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
                                    <DatePicker className="form-control" />
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
                                    <DatePicker className="form-control" />
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
                                    <Input
                                      placeholder="City"
                                      className="form-control"
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
                    <h2>Websites & Social Links</h2>
                    <p className="paragraph-muted">
                      You can add links to websites you want hiring managers to
                      see! Perhaps It will be a link to your portfolio, LinkedIn
                      profile, or personal website
                    </p>
                  </Col>

                  <Col span={24}>
                    <Form.List name="websitesocial">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map(({ key, name, ...restField }) => (
                            <Space
                              key={key}
                              style={{ display: "flex", marginBottom: 8 }}
                              align="baseline"
                            >
                              <Row gutter={[20, 20]}>
                                <Col span={24}>
                                  <Row justify="space-between">
                                    <h2>Title : </h2>
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
                                    name={[name, "label"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: "Missing label",
                                      },
                                    ]}
                                  >
                                    <Input className="form-control" />
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item
                                    {...restField}
                                    name={[name, "link"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: "Missing link",
                                      },
                                    ]}
                                  >
                                    <Input className="form-control" />
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
                              Add one more link
                            </Button>
                          </Form.Item>
                        </>
                      )}
                    </Form.List>
                  </Col>

                  <Col span={24}>
                    {skills.map((skill, index) => (
                      <Tag
                        key={skill}
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
