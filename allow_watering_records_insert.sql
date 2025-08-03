-- 允许所有人在watering_records表中创建数据
-- 授予匿名用户和认证用户插入权限
GRANT INSERT ON TABLE watering_records TO anon, authenticated;

-- 如果表启用了行级安全(RLS)，还需要创建插入策略
-- 先检查是否启用了RLS
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'watering_records';

-- 如果未启用RLS，可以选择启用它
-- ALTER TABLE watering_records ENABLE ROW LEVEL SECURITY;

-- 创建策略允许所有人插入数据
CREATE POLICY allow_insert_watering_records ON watering_records
FOR INSERT
TO PUBLIC
WITH CHECK (true);