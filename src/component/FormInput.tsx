import { Form } from "@raycast/api";
import { imageURLPreviewArguments } from "../util";
import { createContext, SetStateAction, useContext, useMemo, useState } from "react";
import { userWorksPersonalV2 } from "../api/history";

type K = "filePath" | "fromWork" | "fidelity";
type T = {
  filePath: string[];
  fromWork: string;
  fidelity: string;
};

type Props = {
  setValue: (id: K, value: SetStateAction<T[K] | undefined>) => void;
  itemProps: {
    [id in keyof Required<T>]: Partial<Form.ItemProps<T[id]>> & {
      id: string;
    };
  };
};

export const FormInputContext = createContext({
  cookie: "",
  contentType: "image",
});

export function FormInput(props: Props) {
  const { itemProps, setValue } = props;
  const [inputStatus, setInputStatus] = useState(0);

  const toggleIn = (v: number, b: boolean) => {
    if (b) {
      setInputStatus(v);
    } else {
      setInputStatus(0);
      setValue("filePath", undefined);
      setValue("fromWork", undefined);
    }
  };
  const { cookie, contentType } = useContext(FormInputContext);
  const { isLoading, data } = userWorksPersonalV2(cookie, "image", "false");

  const isVideo = useMemo(() => contentType === "video", [contentType]);

  return (
    <>
      <Form.Checkbox
        id="in0"
        value={inputStatus === 1}
        onChange={(v) => toggleIn(1, v)}
        title={isVideo ? "图片及创意描述" : "参考图/垫图"}
        label={"本地上传"}
        info={
          isVideo
            ? "支持 JPG / PNG 格式文件，文件大小不超过 10MB，尺寸不小于 300px"
            : "参考上传图像的风格主题, 生成符合文本描述的作品"
        }
      />
      <Form.Checkbox id="in1" label={"历史作品"} value={inputStatus === 2} onChange={(v) => toggleIn(2, v)} />

      {inputStatus === 1 && <Form.FilePicker title={""} allowMultipleSelection={false} {...itemProps.filePath} />}
      {inputStatus === 2 && (
        <Form.Dropdown isLoading={isLoading} {...itemProps.fromWork}>
          {data.map((task) => {
            return (
              <Form.Dropdown.Section key={task.task.id}>
                {task.works
                  .filter((work) => work.resource.resource)
                  .map((work) => (
                    <Form.Dropdown.Item
                      key={work.workId}
                      value={JSON.stringify(work)}
                      icon={work.resource.resource + imageURLPreviewArguments}
                      title={task.task.taskInfo.arguments[0].value}
                    />
                  ))}
              </Form.Dropdown.Section>
            );
          })}
        </Form.Dropdown>
      )}

      {!isVideo && inputStatus > 0 && (
        <Form.TextField title={"参考强度"} info={"数值越大参考强度越大"} {...itemProps.fidelity} />
      )}
    </>
  );
}
