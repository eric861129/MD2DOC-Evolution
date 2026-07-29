import yaml from 'js-yaml';

export const MAX_YAML_SOURCE_LENGTH = 256 * 1024;

/**
 * 在進入 YAML parser 前限制單一 metadata 區塊大小，避免稿件讓瀏覽器長時間阻塞。
 */
export const parseBoundedYaml = (source: string): unknown => {
  if (source.length > MAX_YAML_SOURCE_LENGTH) {
    throw new RangeError(
      `YAML 內容超過 ${MAX_YAML_SOURCE_LENGTH} 字元限制。`,
    );
  }

  return yaml.load(source, { schema: yaml.DEFAULT_SCHEMA });
};
