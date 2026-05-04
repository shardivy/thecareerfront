import React, { useEffect } from "react";
import dayjs from "dayjs";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Row,
  Col,
  message
} from "antd";

import { useDispatch, useSelector } from "react-redux";

import {
  createAdvertisement,
  updateAdvertisement,
  getAdvertisements
} from "../../../adminSlices/advertisementSlice";

const AddAdvertisementModal = ({
  open,
  onCancel,
  initialValues = null,
  mode = "add", // add | edit | view
}) => {

  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { loading } = useSelector(
    (state) => state.advertisement
  );

  const isView = mode === "view";
  const isEdit = mode === "edit";

  useEffect(() => {
    if (open) {

      if (initialValues) {
        form.setFieldsValue({
          campaignName: initialValues.advertisement_name,
          advertiserName: initialValues.advertiser_name,
          advertiserEmail: initialValues.contact_email,
          mobile: initialValues.contact_mobile,
          amount: initialValues.amount,

          ad_date: (initialValues.ad_date || initialValues.ad_start_date)
            ? dayjs(initialValues.ad_date || initialValues.ad_start_date)
            : null,

          endDate: initialValues.ad_end_date
            ? dayjs(initialValues.ad_end_date)
            : null,

          endTime:
            initialValues?.ad_end_time &&
              initialValues.ad_end_time !== "null"
              ? dayjs(initialValues.ad_end_time, "hh:mm A")
              : null,
        });
      } else {
        form.resetFields();
      }
    }
  }, [initialValues, open]);



  const handleSubmit = async () => {

    try {

      const values = await form.validateFields();

      const payload = {
        advertisement_name: values.campaignName,
        advertiser_name: values.advertiserName,
        contact_mobile: values.mobile,
        contact_email: values.advertiserEmail,

        ad_date: values.ad_date?.format("YYYY-MM-DD"),
        ad_end_date: values.endDate?.format("YYYY-MM-DD"),
        ad_end_time: values.endTime?.format("hh:mm A"),

        amount: values.amount,
      };

      if (isEdit) {

        await dispatch(
          updateAdvertisement({
            id: initialValues.id,
            payload
          })
        ).unwrap();

        message.success("Advertisement updated successfully");

      } else {

        await dispatch(
          createAdvertisement(payload)
        ).unwrap();

        message.success("Advertisement created successfully");
      }

      dispatch(getAdvertisements());

      form.resetFields();
      onCancel();

    } catch (err) {
      console.log(err);
      message.error(
        isEdit
          ? "Failed to update advertisement"
          : "Failed to create advertisement"
      );
    }

  };


  return (
    <Modal
      open={open}
      width={700}
      destroyOnClose
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={!isView ? handleSubmit : onCancel}
      confirmLoading={loading}
      okText={
        isView
          ? "Close"
          : isEdit
            ? "Update"
            : "Save"
      }
      cancelButtonProps={{
        style: {
          display: isView ? "none" : "inline-block"
        }
      }}
      title={
        isView
          ? "View Advertisement"
          : isEdit
            ? "Edit Advertisement"
            : "Add Advertisement"
      }
    >

      <Form
        form={form}
        layout="vertical"
      >

        <Form.Item
          name="campaignName"
          label="Advertisement / Campaign Name"
          rules={[
            { required: true }
          ]}
        >
          <Input disabled={isView} />
        </Form.Item>


        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="advertiserName"
              label="Advertiser Name"
              rules={[{ required: true }]}
            >
              <Input disabled={isView} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="advertiserEmail"
              label="Advertiser Email"
              rules={[{ required: true }]}
            >
              <Input disabled={isView} />
            </Form.Item>
          </Col>
        </Row>


        <Form.Item
          name="mobile"
          label="Mobile Number"
          rules={[{ required: true }]}
        >
          <Input
            maxLength={10}
            disabled={isView}
          />
        </Form.Item>


        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="ad_date"
              label="Date"
            >
              <DatePicker
                style={{ width: "100%" }}
                disabled={isView}
              />
            </Form.Item>
          </Col>

 <Col span={12}>
           <Form.Item
          name="amount"
          label="Amount"
        >
          <InputNumber
            style={{ width: "100%" }}
            disabled={isView}
          />
        </Form.Item>
        </Col>


          {/* <Col span={12}>
            <Form.Item
              name="endDate"
              label="End Date"
            >
              <DatePicker
                style={{ width: "100%" }}
                disabled={isView}
              />
            </Form.Item>
          </Col> */}
        </Row>


        <Row gutter={16}>
          {/* <Col span={12}>
            <Form.Item
              name="startTime"
              label="Start Time"
            >
              <TimePicker
                style={{ width: "100%" }}
                format="hh:mm A"
                use12Hours
                disabled={isView}
              />
            </Form.Item>
          </Col> */}

          {/* <Col span={12}>
            <Form.Item
              name="endTime"
              label="End Time"
            >
              <TimePicker
                style={{ width: "100%" }}
                format="hh:mm A"
                use12Hours
                disabled={isView}
              />
            </Form.Item>
          </Col> */}
        </Row>


       
      </Form>

    </Modal>
  );
};

export default AddAdvertisementModal;
