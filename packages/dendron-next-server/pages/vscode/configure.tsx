import React, { useRef } from "react";
import { engineSlice } from "@dendronhq/common-frontend";
import { Typography, Button, Layout, message } from "antd";
import { useRouter } from "next/router";
import { Formik } from "formik";
import { Form, ResetButton, SubmitButton } from "formik-antd";
import _ from "lodash";
import Ajv, { JSONSchemaType } from "ajv";
import { engineHooks } from "@dendronhq/common-frontend";
import { configWrite } from "../../lib/effects";
import dendronConfig from "../../data/dendronFormConfig";
import ConfigInput from "../../components/formRenderer";
import SideMenu from "../../components/sideMenu";
import { Config } from "../../types/formTypes";

const { Title } = Typography;
const { Content } = Layout;

const generateSchema = (config: Config): any => {
  if (
    config.type === "string" ||
    config.type === "number" ||
    config.type === "boolean"
  ) {
    return { type: config.type };
  }

  if (config.type === "enum") {
    return { enum: config.data };
  }

  if (config.type === "array") {
    return { type: config.type, items: generateSchema(config.data) };
  }

  if (config.type === "record") {
    return {
      type: "object",
      patternProperties: {
        "^[sS]+$": {
          ...generateSchema(config.data),
        },
      },
    };
  }

  const schema: any = {
    type: "object",
    properties: Object.fromEntries(
      Object.keys(config.data).map((key) => [
        key,
        generateSchema(config.data[key]),
      ])
    ),
    required: Object.keys(config.data).filter(
      (key) => config.data[key].required
    ),
  };
  return schema;
};

type DefaultProps = {
  engine: engineSlice.EngineState;
};

const ConfigForm: React.FC<DefaultProps> = ({ engine }) => {
  const [openKeys, setOpenKeys] = React.useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);
  const router = useRouter();
  const { ws, port } = router.query;
  const dispatch = engineHooks.useEngineAppDispatch();
  const ajv = useRef(new Ajv({ allErrors: true }));
  if (!engine.config || !ws || !port) {
    return <></>;
  }

  const schema: JSONSchemaType<any> = generateSchema(dendronConfig);

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 8 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 16 },
    },
  };

  return (
    <Layout
      style={{
        height: "100vh",
        overflowY: "hidden",
      }}
    >
      <SideMenu {...{ openKeys, setOpenKeys, selectedKeys, setSelectedKeys }} />
      <Layout className="site-layout">
        <Content
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            overflowY: "scroll",
          }}
        >
          <Typography style={{ textAlign: "center", padding: "2rem" }}>
            <Title>Dendron Configuration</Title>
          </Typography>
          <Formik
            initialValues={engine.config}
            onSubmit={async (config, { setSubmitting }) => {
              const response: any = await dispatch(
                configWrite({
                  config,
                  ws: ws as string,
                  port: Number(port as string),
                })
              );
              if (response.error) {
                message.error(response.payload);
              }
              message.success("Saved!");
              setSubmitting(false);
            }}
            validate={(values) => {
              let errors: any = {};
              const validate = ajv.current.compile(schema);
              validate(values);
              const { errors: ajvErrors } = validate;

              if (!ajvErrors?.length) {
                return {};
              }

              ajvErrors?.forEach((error) => {
                const { instancePath, message } = error;
                if (instancePath !== "") {
                  errors[`${instancePath.substring(1)}`] = message;
                }
              });
              return {};
            }}
            validateOnChange={true}
          >
            {({ values, errors }) => (
              <Form {...formItemLayout}>
                <ConfigInput
                  data={dendronConfig}
                  values={values}
                  errors={errors}
                  prefix={[]}
                  setSelectedKeys={setSelectedKeys}
                />
                <Form.Item name="submit" style={{ justifyContent: "center" }}>
                  <Button.Group size="large">
                    <ResetButton type="text">Clear changes</ResetButton>
                    <SubmitButton
                      type="primary"
                      disabled={!_.isEmpty(errors.site)}
                    >
                      Save changes
                    </SubmitButton>
                  </Button.Group>
                </Form.Item>
              </Form>
            )}
          </Formik>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ConfigForm;
