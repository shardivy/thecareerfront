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
    Switch,

} from "antd";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { createEvent, getEvents, updateEvent, markEventCompleted } from "../../../adminSlices/eventSlice";

const AddEventModal = ({ open, onCancel, mode = "add", data }) => {
    const [form] = Form.useForm();
    const dispatch = useDispatch();

    const { loading } = useSelector((state) => state.event);
    const { createLoading, updateLoading, completeLoading } = useSelector(
        (state) => state.event
    );

    const eventType = Form.useWatch("eventType", form);
    const modeValue = Form.useWatch("mode", form);

    const sessionType = Form.useWatch("sessionType", form);
    const paymentType = Form.useWatch("paymentType", form);

    const isView = mode === "view";

    /* ================= SUBMIT ================= */
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            const formattedValues = {
                event_type: values.eventType,
                seminar_webinar_name: values.eventName,

                concerned_person_name: values.person,
                concerned_person_mobile: values.mobile,
                concerned_person_email: values.email,

                event_start_date: values.startDate?.format("YYYY-MM-DD"),
                event_end_date: values.endDate?.format("YYYY-MM-DD"),

                event_start_time: values.startTime?.format("hh:mm A"),
                event_end_time: values.endTime?.format("hh:mm A"),

                event_mode: values.mode,

                venue_type: values.category || "",
                address: values.venue || "",

                is_paid: values.sessionType === "paid",
                registration_link:
                    values.mode === "online" ? values.link : "",
            };

            // ✅ ONLY IF PAID
            if (values.sessionType === "paid") {
                formattedValues.payment_type = values.paymentType;
                formattedValues.payment_method =
                    values.paymentType === "online" ? "upi" : "cash";
                formattedValues.amount = values.amount;

                if (values.paymentType === "online") {
                    formattedValues.transaction_id = values.transactionId;
                }
            }

            // 🔥 DIFFERENCE HERE
            if (mode === "edit") {
                await dispatch(
                    updateEvent({
                        id: data.id,   // ✅ IMPORTANT
                        data: formattedValues,
                    })
                ).unwrap();

                message.success("Event updated successfully");
            } else {
                await dispatch(createEvent(formattedValues)).unwrap();
                message.success("Event created successfully");
            }

            // 🔄 refresh list
            await dispatch(getEvents());

            form.resetFields();
            onCancel();

        } catch (err) {
            // console.log(err);
            message.error(err || "Failed");
        }
    };

    const handleMarkCompleted = () => {
        const modal = Modal.confirm({
            title: "Mark Event as Completed?",
            content: "Are you sure you want to mark this event as completed?",
            okText: "Yes, Complete",
            cancelText: "Cancel",
            centered: true,
            maskClosable: true,

            onOk: async () => {
                try {
                    await dispatch(markEventCompleted(data.id)).unwrap();

                    message.success("Event marked as completed");

                    await dispatch(getEvents());

                    modal.destroy();
                    onCancel();
                } catch (err) {
                    message.error(err || "Failed to update status");
                }
            },

            onCancel: () => {
                modal.destroy();
            },
        });
    };

    /* ================= SET DATA (EDIT/VIEW) ================= */
    useEffect(() => {
        if (data && (mode === "edit" || mode === "view")) {
            form.setFieldsValue({
                eventName: data.seminar_webinar_name,
                eventType: data.event_type,
                mode: data.event_mode,

                link: data.registration_link || "",

                category: data.venue_type,
                venue: data.address,

                startDate: data.event_start_date
                    ? dayjs(data.event_start_date)
                    : null,

                endDate: data.event_end_date
                    ? dayjs(data.event_end_date)
                    : null,

                startTime: data.event_start_time
                    ? dayjs(data.event_start_time, "hh:mm A")
                    : null,

                endTime: data.event_end_time
                    ? dayjs(data.event_end_time, "hh:mm A")
                    : null,

                person: data.concerned_person_name,
                email: data.concerned_person_email,
                mobile: data.concerned_person_mobile,

                sessionType: data.is_paid ? "paid" : "free",
                paymentType: data.payment_type,
                amount: data.amount,
                transactionId: data.transaction_id,
            });
        } else {
            form.resetFields();
        }
    }, [data, mode]);

    /* ================= AUTO MODE LOGIC (KEEP ORIGINAL) ================= */
    useEffect(() => {
        if (!eventType) return;

        if (eventType === "webinar") {
            form.setFieldsValue({ mode: "online" });
        }

        if (eventType === "seminar") {
            form.setFieldsValue({ mode: "offline" });
        }
    }, [eventType]);

    

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
            width={700}
            confirmLoading={loading}
            bodyStyle={{
                maxHeight: "70vh",
                overflowY: "auto",
                paddingRight: "8px",
            }}
            footer={
                mode === "view" ? (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end", // left side
                            width: "100%",
                        }}
                    >
                        <Button onClick={onCancel}>
                            Close
                        </Button>
                    </div>
                ) : (
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            justifyContent: "space-between",
                            width: "100%",
                        }}
                    >
                        {/* LEFT SIDE */}
                        <div
                            style={{
                                flex: "1 1 auto", // ✅ auto width for desktop
                                minWidth: "200px", // ✅ helps stacking on mobile
                            }}
                        >
                            {mode === "edit" && data?.session_status !== "completed" && (
                                <Button
                                    type="primary"
                                    onClick={handleMarkCompleted}
                                    loading={completeLoading}
                                    style={{
                                        backgroundColor: "#52c41a",
                                        borderColor: "#52c41a",
                                        width: "100%", // mobile full width
                                        maxWidth: "220px", // desktop fixed width
                                    }}
                                >
                                    Mark as Completed
                                </Button>
                            )}
                        </div>

                        {/* RIGHT SIDE */}
                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                                justifyContent: "flex-end",
                                flex: "3 1 auto",
                            }}
                        >
                            <Button
                                onClick={onCancel}
                                style={{ minWidth: "100px" }}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="primary"
                                onClick={handleSubmit}
                                loading={mode === "edit" ? updateLoading : createLoading}
                                style={{ minWidth: "120px" }}
                            >
                                {mode === "edit" ? "Update" : "Create"}
                            </Button>
                        </div>
                    </div>
                )
            }
        >
            <Form layout="vertical" form={form}>
                {/* EVENT NAME */}
                <Form.Item
                    label="Event Name"
                    name="eventName"
                    rules={[{ required: true, message: "Enter event name" }]}
                >
                    <Input placeholder="Enter event name" disabled={isView} />
                </Form.Item>

                {/* EVENT TYPE + MODE */}
                <Row gutter={12}>
                    <Col span={12}>
                        <Form.Item
                            label="Event Type"
                            name="eventType"
                            rules={[
                                {
                                    required: true,
                                    message: "Select event type",
                                },
                            ]}
                        >
                            <Radio.Group disabled={isView}>
                                <Radio value="webinar">Webinar</Radio>
                                <Radio value="seminar">Seminar</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Mode"
                            name="mode"
                            rules={[{ required: true, message: "Select mode" }]}
                        >
                            <Radio.Group disabled={isView}>
                                <Radio value="online">Online</Radio>
                                <Radio value="offline">Offline</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                </Row>

                {/* ONLINE */}
                {modeValue === "online" && (
                    <Form.Item
                        label="Webinar Link"
                        name="link"
                        rules={[
                            {
                                required: true,
                                message: "Enter webinar link",
                            },
                        ]}
                    >
                        <Input
                            placeholder="Enter meeting link"
                            disabled={isView}
                        />
                    </Form.Item>
                )}

                {/* OFFLINE */}
                {modeValue === "offline" && (
                    <>
                        <Form.Item
                            label="Select Category"
                            name="category"
                            rules={[
                                {
                                    required: true,
                                    message: "Select category",
                                },
                            ]}
                        >
                            <Select
                                placeholder="Select category"
                                disabled={isView}
                                options={[
                                    { label: "College", value: "college" },
                                    { label: "Corporate", value: "corporate" },
                                    { label: "Other", value: "other" },
                                ]}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Venue / Address"
                            name="venue"
                            rules={[
                                {
                                    required: true,
                                    message: "Enter venue",
                                },
                            ]}
                        >
                            <Input
                                placeholder="Enter venue/address"
                                disabled={isView}
                            />
                        </Form.Item>
                    </>
                )}

                {/* DATE + TIME */}
                <Row gutter={12}>
                    <Col span={12}>
                        <Form.Item
                            label="Start Date"
                            name="startDate"
                            rules={[{ required: true, message: "Select start date" }]}
                        >
                            <DatePicker style={{ width: "100%" }} disabled={isView} />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="End Date"
                            name="endDate"
                        //   rules={[{ required: true, message: "Select end date" }]}
                        >
                            <DatePicker style={{ width: "100%" }} disabled={isView} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={12}>
                    <Col span={12}>
                        <Form.Item
                            label="Start Time"
                            name="startTime"
                            rules={[{ required: true, message: "Select start time" }]}
                        >
                            <TimePicker
                                style={{ width: "100%" }}
                                format="hh:mm A"
                                disabled={isView}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="End Time"
                            name="endTime"
                          rules={[{ required: true, message: "Select end time" }]}
                        >
                            <TimePicker
                                style={{ width: "100%" }}
                                format="hh:mm A"
                                disabled={isView}
                            />
                        </Form.Item>
                    </Col>
                </Row>


                {/* PERSON + EMAIL + MOBILE */}
                <Row gutter={12}>
                    <Col span={12}>
                        <Form.Item
                            label="Concerned Person / Organizer"
                            name="person"
                            rules={[
                                {
                                    required: true,
                                    message: "Enter person name",
                                },
                            ]}
                        >
                            <Input
                                placeholder="Enter name"
                                disabled={isView}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Concerned Person's Email"
                            name="email"
                            rules={[
                                {
                                    required: true,
                                    message: "Enter email",
                                },
                                {
                                    type: "email",
                                    message: "Enter valid email",
                                },
                            ]}
                        >
                            <Input
                                placeholder="Enter email"
                                disabled={isView}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    label="Concerned Person's Mobile Number"
                    name="mobile"
                    rules={[
                        {
                            required: true,
                            message: "Enter mobile number",
                        },
                        {
                            pattern: /^[0-9]{10}$/,
                            message: "Enter valid 10-digit number",
                        },
                    ]}
                >
                    <Input
                        placeholder="Enter mobile number"
                        maxLength={10}
                        disabled={isView}
                    />
                </Form.Item>



                {/* ================= SESSION TYPE ================= */}
                <Form.Item
                    label="Event Pricing"
                    name="sessionType"
                >
                    <Switch
                        checkedChildren="Paid Event"
                        unCheckedChildren="Free Event"
                        checked={sessionType === "paid"}
                        disabled={isView}
                        onChange={(checked) => {
                            form.setFieldsValue({
                                sessionType: checked ? "paid" : "free",
                                paymentType: undefined,
                            });
                        }}
                    />
                </Form.Item>


                {/* ================= PAYMENT FIELDS (ONLY PAID) ================= */}
                {sessionType === "paid" && (
                    <Row gutter={12}>
                        {/* PAYMENT TYPE */}
                        <Col span={12}>
                            <Form.Item
                                label="Payment Type"
                                name="paymentType"
                                rules={[
                                    {
                                        required: true,
                                        message: "Select payment type",
                                    },
                                ]}
                            >
                                <Select
                                    placeholder="Select payment type"
                                    disabled={isView}
                                    options={[
                                        { label: "Online", value: "online" },
                                        { label: "Offline", value: "offline" },
                                    ]}
                                />
                            </Form.Item>
                        </Col>

                        {/* PAYMENT METHOD */}
                        <Col span={12}>
                            <Form.Item label="Payment Method">
                                <Input
                                    disabled={isView}
                                    value={
                                        paymentType === "online"
                                            ? "UPI"
                                            : paymentType === "offline"
                                                ? "Cash"
                                                : ""
                                    }
                                    placeholder="Select method"
                                />
                            </Form.Item>
                        </Col>

                        {/* TRANSACTION ID - ONLY FOR UPI */}
                        {paymentType === "online" && (
                            <Col span={24}>
                                <Form.Item
                                    label="Transaction ID"
                                    name="transactionId"
                                >
                                    <Input
                                        placeholder="Enter UPI Transaction ID"
                                        disabled={isView}
                                    />
                                </Form.Item>
                            </Col>
                        )}

                        {/* AMOUNT */}
                        <Col span={24}>
                            <Form.Item
                                label="Amount"
                                name="amount"
                                rules={[
                                    {
                                        required: true,
                                        message: "Enter amount",
                                    },
                                    {
                                        pattern: /^[0-9]+$/,
                                        message: "Enter valid amount",
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="Enter amount"
                                    disabled={isView}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                )}
            </Form>
        </Modal>
    );
};

export default AddEventModal;