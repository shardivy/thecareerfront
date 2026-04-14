import { useEffect } from "react";
import {
    Modal,
    Form,
    Input,
    DatePicker,
    TimePicker,
    Select,
    Radio,
    message,
    Row,
    Col,  
    Button,  
} from "antd";
import dayjs from "dayjs";

const AddEventModal = ({ open, onCancel, mode = "add", data }) => {
    const [form] = Form.useForm();

    const eventType = Form.useWatch("eventType", form); // 👈 watch radio
    const isView = mode === "view";

const handleSubmit = () => {
  form.validateFields()
    .then((values) => {
      const formattedValues = {
        ...values,
        date: values.date?.format("YYYY-MM-DD"),
        time: values.time?.format("hh:mm A"),
      };

      console.log("Event Data:", formattedValues);
      message.success(
        mode === "edit"
          ? "Event Updated Successfully"
          : "Event Created Successfully"
      );

      form.resetFields();
      onCancel();
    })
    .catch(() => {});
};

useEffect(() => {
  if (data && (mode === "edit" || mode === "view")) {
    form.setFieldsValue({
      ...data,
      date: data.date ? dayjs(data.date) : null,
      time: data.time ? dayjs(data.time, "hh:mm A") : null,
    });
  } else {
    form.resetFields();
  }
}, [data, mode]);

    return (
     <Modal
  title={
    mode === "view"
      ? "View Event"
      : mode === "edit"
      ? "Edit Event"
      : "Add Event"
  }
  open={open}
  onCancel={onCancel}
  centered
  footer={
    mode === "view"
      ? [
          <Button key="close" onClick={onCancel}>
            Close
          </Button>,
        ]
      : [
          <Button key="cancel" onClick={onCancel}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            {mode === "edit" ? "Update" : "Create"}
          </Button>,
        ]
  }
>
            <Form layout="vertical" form={form}>
                
                {/* EVENT NAME */}
                <Form.Item
                    label="Event Name"
                    name="eventName"
                    rules={[{ required: true, message: "Enter event name" }]}
                >
                    <Input placeholder="Enter event name"  disabled={isView}/>
                </Form.Item>

                {/* EVENT TYPE */}
                <Form.Item
                    label="Event Type"
                    name="eventType"
                    rules={[{ required: true, message: "Select event type" }]}
                >
                    <Radio.Group  disabled={isView}>
                        <Radio value="webinar">Webinar</Radio>
                        <Radio value="seminar">Seminar</Radio>
                    </Radio.Group>
                </Form.Item>

                {/* CONDITIONAL FIELD */}
                {eventType === "webinar" && (
                    <Form.Item
                        label="Webinar Link"
                        name="link"
                        rules={[{ required: true, message: "Enter webinar link" }]}
                    >
                        <Input placeholder="Enter meeting link"  disabled={isView}/>
                    </Form.Item>
                )}

                {eventType === "seminar" && (
                    <Form.Item
                        label="Venue / Address"
                        name="venue"
                        rules={[{ required: true, message: "Enter venue" }]}
                    >
                        <Input placeholder="Enter venue/address"  disabled={isView}/>
                    </Form.Item>
                )}

              {/* DATE + TIME IN SAME ROW */}
<Row gutter={12}>
    <Col span={12}>
        <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true, message: "Select date" }]}
        >
            <DatePicker style={{ width: "100%" }} disabled={isView}/>
        </Form.Item>
    </Col>

    <Col span={12}>
        <Form.Item
            label="Time"
            name="time"
            rules={[{ required: true, message: "Select time" }]}
        >
            <TimePicker style={{ width: "100%" }} format="hh:mm A" disabled={isView}/>
        </Form.Item>
    </Col>
</Row>

                {/* CONCERNED PERSON */}
                {/* CONCERNED PERSON + EMAIL IN SAME ROW */}
<Row gutter={12}>
    <Col xs={24} md={12}>
        <Form.Item
            label="Concerned Person / Organizer"
            name="person"
            rules={[{ required: true, message: "Enter person name" }]}
        >
            <Input placeholder="Enter name"  disabled={isView}/>
        </Form.Item>
    </Col>

    <Col xs={24} md={12}>
        <Form.Item
            label="Concerned Person's Email"
            name="email"
            rules={[
                { required: true, message: "Enter email" },
                { type: "email", message: "Enter valid email" },
            ]}
        >
            <Input placeholder="Enter email"  disabled={isView}/>
        </Form.Item>
    </Col>
</Row>

                {/* PAID / FREE */}
                <Form.Item
                    label="Session Type"
                    name="sessionType"
                    rules={[{ required: true }]}
                >
                    <Select
                        placeholder="Select type"
                            disabled={isView}
                        options={[
                            { label: "Free", value: "free" },
                            { label: "Paid", value: "paid" },
                        ]}
                    />
                </Form.Item>

              
            </Form>
        </Modal>
    );
};

export default AddEventModal;