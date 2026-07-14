import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  Button,
  Row,
  Col,
  message,
  Empty,
  Grid,
} from "antd";
import { FacebookFilled, UploadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";

import { fetchPackages } from "../../../adminSlices/packageSlice";
import {
  submitPayment,
  resetPaymentState,
  fetchStudentPaymentSummary,
} from "../../../adminSlices/paymentSlice";
import { fetchStudents } from "../../../adminSlices/userSlice";
import { fetchPendingParticipants } from "../../../hhSlices/handholdingUsersSlice";
import { fetchHandholdingSummary } from "../../../hhSlices/handholdingPaymentSlice";

const { Option } = Select;
const { useBreakpoint } = Grid;

const UploadPaymentModal = ({ open, onClose, onSuccess, paymentData }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const isHandholding = paymentData?.type === "handholding";

  const { list: students = [], loading: studentsLoading } = useSelector(
    (state) => state.users
  );

  const { list: packageList = [], loading: packageLoading } = useSelector(
    (state) => state.packages
  );

  const { data: hhSummary } = useSelector(
    (state) => state.handholdingPayment
  );

  const {
    pendingParticipants = [],
    pendingLoading,
  } = useSelector((state) => state.handholdingUsers);

  const {
    submitLoading,
    submitSuccess,
    submitError,
    summaryLoading,
    summaryData,
    summaryError,
  } = useSelector((state) => state.payment);

  const [fileList, setFileList] = useState([]);
  const [previewUrl, setPreviewUrl] = useState("");

  /* ================= FETCH STUDENTS & PACKAGES ================= */
  // useEffect(() => {
  //   if (open) {
  //     dispatch(fetchStudents());
  //     dispatch(fetchPackages());
  //   }
  // }, [open, dispatch]);

  useEffect(() => {
    if (open) {
      if (paymentData?.type === "handholding") {
        dispatch(fetchPendingParticipants());
      } else {
        dispatch(fetchStudents());
      }

      dispatch(fetchPackages());
    }
  }, [open, paymentData, dispatch]);

  /* ================= FILE PREVIEW ================= */
  useEffect(() => {
    if (fileList.length > 0 && fileList[0].originFileObj) {
      setPreviewUrl(URL.createObjectURL(fileList[0].originFileObj));
    } else {
      setPreviewUrl("");
    }
  }, [fileList]);

  useEffect(() => {
    if (summaryError) {
      message.error(summaryError);
    }
  }, [summaryError]);

  useEffect(() => {
    if (summaryData?.remaining_amount !== undefined) {
      form.setFieldsValue({
        amount: summaryData.remaining_amount,
      });
    }
  }, [summaryData, form]);

  useEffect(() => {
    if (
      isHandholding &&
      hhSummary?.data?.remaining_amount !== undefined
    ) {
      form.setFieldsValue({
        amount: hhSummary.data.remaining_amount,
      });
    }
  }, [hhSummary, isHandholding, form]);

  // useEffect(() => {
  //   if (open && paymentData) {
  //     const selectedId = isHandholding
  //       ? paymentData.originalData?.handholding_participant_id
  //       : paymentData.originalData?.student_id;

  //     form.setFieldsValue({
  //       student_profile: selectedId,
  //       package: paymentData.originalData?.package_id,
  //       // amount: paymentData.packagePrice || "",
  //     });

  //     if (selectedId && paymentData.originalData?.package_id) {
  //       if (isHandholding) {
  //         // ✅ CALL YOUR NEW API HERE
  //         dispatch(
  //           fetchHandholdingSummary({
  //             participantId: selectedId,
  //             packageId: paymentData.originalData.package_id,
  //           })
  //         );
  //       } else {
  //         dispatch(
  //           fetchStudentPaymentSummary({
  //             studentId: selectedId,
  //             packageId: paymentData.originalData.package_id,
  //           })
  //         );
  //       }
  //     }
  //   }
  // }, [open, paymentData, dispatch, form, isHandholding]);

  useEffect(() => {
    if (open && paymentData) {
      const selectedId = isHandholding
        ? paymentData.originalData?.handholding_participant_id
        : paymentData.originalData?.student_id;

      // ✅ Try all possible locations for package_id
      const packageId =
        paymentData.package_id ||                           // from apiPaymentRecords (packageIds[0])
        paymentData.originalData?.package_id ||             // old flat field
        (Array.isArray(paymentData.originalData?.package_ids)
          ? paymentData.originalData.package_ids[0]
          : null) ||
        paymentData.packageIds?.[0] ||                      // from apiPaymentRecords
        null;

      form.setFieldsValue({
        student_profile: selectedId,
        package: packageId,
      });

      if (selectedId && packageId) {
        if (isHandholding) {
          dispatch(fetchHandholdingSummary({ participantId: selectedId, packageId }));
        } else {
          dispatch(fetchStudentPaymentSummary({ studentId: selectedId, packageId }));
        }
      }
    }
  }, [open, paymentData, dispatch, form, isHandholding]);

  /* ================= SUBMIT ================= */
  const handleSubmit = (values) => {
    const formData = new FormData();

    if (isHandholding) {
      // ✅ send BOTH
      formData.append("handholding_participant", values.student_profile);

      // 👇 IMPORTANT: map correct student id
      const selected = pendingParticipants.find(
        (u) => u.id === values.student_profile
      );

      if (selected?.student_id) {
        formData.append("student_profile", selected.student_id);
      }
    } else {
      formData.append("student_profile", values.student_profile);
    }

    // Append all package IDs from summary packages
    const packagesToSend = summaryPackages.length > 0 ? summaryPackages : [];
    packagesToSend.forEach((pkg) => {
      formData.append("package", pkg.package_id);
    });

    formData.append("amount", values.amount);
    formData.append("payment_type", values.payment_type);
    formData.append("method", values.method);

    if (values.transactionId) {
      formData.append("transaction_id", values.transactionId);
    }

    formData.append(
      "payment_date",
      dayjs(values.paymentDate).format("YYYY-MM-DD")
    );

    if (fileList.length && fileList[0].originFileObj) {
      formData.append("proof_file", fileList[0].originFileObj);
    }

    dispatch(submitPayment(formData));
  };

  /* ================= SUCCESS / ERROR ================= */
  useEffect(() => {
    if (submitSuccess) {
      message.success("Payment submitted successfully");
      form.resetFields();
      setFileList([]);
      setPreviewUrl("");
      dispatch(resetPaymentState());
      onSuccess?.();
      handleClose();
    }

   if (submitError) {
  console.log("submitError =>", submitError);

  message.error(
    submitError?.errors ||
    submitError?.message ||
    submitError?.error ||
    "An error occurred"
  );
}
  }, [submitSuccess, submitError, dispatch, form, onClose, onSuccess]);

  /* ================= HANDLE STUDENT SELECT ================= */
  // const handleStudentChange = (studentId) => {
  //   const list = isHandholding ? pendingParticipants : students;

  //   const student = list.find((s) => s.id === studentId);

  //   const packageId = student?.package_id;

  //   form.setFieldsValue({
  //     package: packageId,
  //   });

  //   if (studentId && packageId) {
  //     if (isHandholding) {
  //       // ✅ CALL NEW API
  //       dispatch(
  //         fetchHandholdingSummary({
  //           participantId: studentId,
  //           packageId,
  //         })
  //       );
  //     } else {
  //       dispatch(
  //         fetchStudentPaymentSummary({
  //           studentId,
  //           packageId,
  //         })
  //       );
  //     }
  //   }
  // };


  const handleStudentChange = (studentId) => {
    const list = isHandholding ? pendingParticipants : students;
    const student = list.find((s) => s.id === studentId);

    // ✅ Same fallback logic
    const packageId =
      student?.package_id ||
      paymentData?.package_id ||
      paymentData?.packageIds?.[0] ||
      null;

    form.setFieldsValue({ package: packageId });

    if (studentId && packageId) {
      if (isHandholding) {
        dispatch(fetchHandholdingSummary({ participantId: studentId, packageId }));
      } else {
        dispatch(fetchStudentPaymentSummary({ studentId, packageId }));
      }
    }
  };

  /* ================= HANDLE PACKAGE CHANGE ================= */
  const handlePackageChange = (packageId) => {
    const studentId = form.getFieldValue("student_profile");

    if (studentId && packageId) {
      if (isHandholding) {
        // ✅ CALL NEW API
        dispatch(
          fetchHandholdingSummary({
            participantId: studentId,
            packageId,
          })
        );
      } else {
        dispatch(
          fetchStudentPaymentSummary({
            studentId,
            packageId,
          })
        );
      }
    }
  };

  const disableFutureDates = (current) => {
    return current && current > dayjs().endOf("day");
  };

  const studentList =
    paymentData?.type === "handholding"
      ? pendingParticipants
      : students;

  const studentLoading =
    paymentData?.type === "handholding"
      ? pendingLoading
      : studentsLoading;

  const summaryPackages =
    summaryData?.packages ||
    hhSummary?.data?.packages ||
    [];

  const packageNames = summaryPackages
    .map((pkg) => pkg?.package_name || pkg?.name || "")
    .filter(Boolean);

  const packageOptions = summaryPackages.length
    ? summaryPackages.map((pkg) => ({
      value: pkg.package_id,
      label: pkg.package_name || pkg.name || "Package",
    }))
    : packageList.map((pkg) => ({
      value: pkg.id,
      label: pkg.name,
    }));

  useEffect(() => {
    if (summaryPackages.length > 0) {
      const currentPackage = form.getFieldValue("package");
      const hasCurrent = summaryPackages.some(
        (pkg) => pkg.package_id === currentPackage
      );
      if (!hasCurrent) {
        form.setFieldsValue({ package: summaryPackages[0].package_id });
      }
    }
  }, [summaryPackages, form]);


  const handleClose = () => {
    form.resetFields();
    setFileList([]);
    setPreviewUrl("");
    onClose();
  };


  return (
    <Modal
      open={open}
      // onCancel={onClose}
      onCancel={handleClose}

      title="Upload Payment"
      okText="Submit Payment"
      onOk={() => form.submit()}
      confirmLoading={submitLoading}
      width={isMobile ? "95%" : "55%"}
      style={{ maxWidth: 900 }}
      centered
    >
      <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 8 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={(changedValues) => {
            if (changedValues.payment_type) {
              form.setFieldsValue({
                method: undefined,
                transactionId: undefined,
              });
            }

            if (
              Object.prototype.hasOwnProperty.call(changedValues, "method") &&
              changedValues.method !== "upi"
            ) {
              form.setFieldsValue({ transactionId: undefined });
            }
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={isHandholding ? "Select User" : "Select Student"}
                name="student_profile"
                rules={[{ required: true, message: "Please select student" }]}
              >
                <Select
                  placeholder={isHandholding ? "Select user" : "Select student"}
                  loading={studentLoading}
                  showSearch
                  optionFilterProp="label"
                  onChange={handleStudentChange}
                  options={studentList.map((student) => ({
                    value: student.id,
                    label: (
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {student.first_name} {student.last_name}
                        </div>
                        <div>
                          {student.email}
                        </div>
                      </div>
                    ),
                  }))}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Counselling Services">
                <Input.TextArea
                  value={packageNames.join("\n")}
                  autoSize={{ minRows: 2, maxRows: 12 }}
                  disabled
                />
              </Form.Item>
            </Col>

            {/* <Col span={12}>
              <Form.Item
                label="Counselling Service"
                name="package"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="Select counselling service"
                  loading={packageLoading}
                  onChange={handlePackageChange}
                  options={packageOptions}
                />
              </Form.Item>
            </Col> */}
          </Row>

          <Row>
            <Col span={24}>
              <Form.Item label="Amount Due" name="amount">
                {/* <Input
    disabled={Boolean(paymentData) && paymentData?.status !== "Not Paid"}
  /> */}
                <Input
                  disabled={
                    paymentData?.type !== "handholding" &&
                    Boolean(paymentData) &&
                    paymentData?.status !== "Not Paid"
                  }
                />
              </Form.Item>
            </Col>
          </Row>


          <Row gutter={16}>
            {/* <Col span={12}>
            <Form.Item
              label="Amount Paid"
              name="amount"
              rules={[{ required: true }]}
            >
              <Input placeholder="₹ Amount" />
            </Form.Item>
          </Col> */}

            <Col span={12}>
              <Form.Item
                name="payment_type"
                label="Payment Type"
                rules={[{ required: true, message: "Please select payment type" }]}
              >
                <Select placeholder="Select payment type"
                  onChange={(value) => {
                    if (value === "online") {
                      form.setFieldsValue({
                        method: "upi",
                        transactionId: undefined,
                      });
                    } else if (value === "offline") {
                      form.setFieldsValue({
                        method: "cash",
                        transactionId: undefined,
                      });
                    }
                  }}
                >
                  <Option value="online">Online</Option>
                  <Option value="offline">Offline</Option>
                </Select>
              </Form.Item>
            </Col>


            <Col span={12}>
              <Form.Item shouldUpdate>
                {({ getFieldValue }) => {
                  const paymentType = getFieldValue("payment_type");

                  return (
                    <Form.Item
                      name="method"
                      label="Payment Method"
                      rules={[{ required: true }]}
                    >
                      <Select placeholder="Select payment method" disabled={!paymentType}>
                        {paymentType === "online" && (
                          <Option value="upi">UPI</Option>
                        )}
                        {paymentType === "offline" && (
                          <Option value="cash">Cash</Option>
                        )}
                      </Select>
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item shouldUpdate>
                {({ getFieldValue }) =>
                  getFieldValue("method") === "upi" ? (
                    <Form.Item
                      label="Transaction ID"
                      name="transactionId"
                      validateTrigger="onChange"
                      rules={[
                        {
                          required: true,
                          message: "Please enter transaction ID",

                        },
                        // {
                        //   pattern: /^[0-9]{12,16}$/,
                        //   message:
                        //     "Transaction ID must be 12-16 digits only",
                        // },
                      ]}
                    >
                      <Input
                        placeholder="Enter Transaction ID"
                        // maxLength={16}
                      />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>


            </Col>
          </Row>

          <Form.Item
            label="Payment Date"
            name="paymentDate"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: "100%" }} disabledDate={disableFutureDates} />
          </Form.Item>

          <Form.Item label="Upload Receipt">
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                border: "1px dashed #d9d9d9",
                padding: 16,
                borderRadius: 8,
              }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Receipt Preview"
                  style={{
                    width: 160,
                    height: 160,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              ) : (
                <Empty description="No receipt uploaded" />
              )}

              <Upload
                beforeUpload={() => false}
                maxCount={1}
                showUploadList={false}
                fileList={fileList}
                onChange={({ fileList }) => {
                  setFileList(fileList);

                  if (fileList[0]?.originFileObj) {
                    setPreviewUrl(
                      URL.createObjectURL(fileList[0].originFileObj)
                    );
                  } else {
                    setPreviewUrl("");
                  }
                }}
              >
                <Button icon={<UploadOutlined />}>
                  Upload Receipt
                </Button>
              </Upload>
            </div>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default UploadPaymentModal;
