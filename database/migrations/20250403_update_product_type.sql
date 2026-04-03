-- ============================================
-- MyIOS 质量事件表结构升级脚本
-- 修改 product_type 字段支持多选
-- ============================================

USE pis_system;

-- 修改产品类型字段为 TEXT 类型，支持多选存储为 JSON 数组
ALTER TABLE quality_event MODIFY COLUMN product_type TEXT COMMENT '产品类型 JSON数组：地铁机器人/国铁巡检仪/国铁功能模块-扣件/国铁功能模块-位移/国铁功能模块-廓形/车载系统';

-- 验证迁移结果
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'quality_event' 
  AND TABLE_SCHEMA = 'pis_system'
  AND COLUMN_NAME = 'product_type';
