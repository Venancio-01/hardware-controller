// 测试 Zod 验证是否正常工作
import { z } from 'zod';

const schema = z.object({
  VOICE_CONTROL_VOLUME: z.number().int().min(0).max(10).optional().default(10),
});

// 测试 1: 有效值
console.log('测试 1: 有效值 5');
const result1 = schema.safeParse({ VOICE_CONTROL_VOLUME: 5 });
console.log('结果:', result1);

// 测试 2: 无效值 (超出范围)
console.log('\n测试 2: 无效值 99');
const result2 = schema.safeParse({ VOICE_CONTROL_VOLUME: 99 });
console.log('结果:', result2);
if (!result2.success) {
  console.log('错误详情:', result2.error.errors);
}

// 测试 3: undefined (应该使用默认值)
console.log('\n测试 3: undefined');
const result3 = schema.safeParse({ VOICE_CONTROL_VOLUME: undefined });
console.log('结果:', result3);

// 测试 4: 空对象 (应该使用默认值)
console.log('\n测试 4: 空对象');
const result4 = schema.safeParse({});
console.log('结果:', result4);
