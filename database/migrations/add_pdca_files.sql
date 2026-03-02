-- 添加PDCA各阶段附件字段（如果还没有）
-- 这些字段用于存储Plan、Do、Check、Act各阶段的附件

-- plan_files
ALTER TABLE quality_event 
ADD COLUMN IF NOT EXISTS plan_files TEXT COMMENT 'Plan阶段附件（JSON数组）';

-- implementation_files (Do阶段)
ALTER TABLE quality_event 
ADD COLUMN IF NOT EXISTS implementation_files TEXT COMMENT 'Do阶段实施附件（JSON数组）';

-- check_files
ALTER TABLE quality_event 
ADD COLUMN IF NOT EXISTS check_files TEXT COMMENT 'Check阶段附件（JSON数组）';

-- act_files
ALTER TABLE quality_event 
ADD COLUMN IF NOT EXISTS act_files TEXT COMMENT 'Act阶段附件（JSON数组）';

SELECT 'PDCA attachment columns added successfully!' AS message;
