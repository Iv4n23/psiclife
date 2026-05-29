-- DropForeignKey
ALTER TABLE `productos` DROP FOREIGN KEY `fk_productos_categoria`;
ALTER TABLE `productos_fotos` DROP FOREIGN KEY `fk_prod_fotos_producto`;
ALTER TABLE `productos_presentaciones` DROP FOREIGN KEY `fk_prod_pres_producto`;

-- RenameTable
RENAME TABLE `productos` TO `servicios`;
RENAME TABLE `productos_fotos` TO `servicios_fotos`;
RENAME TABLE `productos_presentaciones` TO `servicios_presentaciones`;

-- RenameColumns
ALTER TABLE `servicios_fotos` RENAME COLUMN `producto_id` TO `servicio_id`;
ALTER TABLE `servicios_presentaciones` RENAME COLUMN `producto_id` TO `servicio_id`;

-- RenameIndexes
ALTER TABLE `servicios` RENAME INDEX `idx_productos_categoria` TO `idx_servicios_categoria`;
ALTER TABLE `servicios_fotos` RENAME INDEX `idx_prod_fotos_producto` TO `idx_serv_fotos_servicio`;
ALTER TABLE `servicios_presentaciones` RENAME INDEX `idx_prod_pres_producto` TO `idx_serv_pres_servicio`;

-- AddForeignKey
ALTER TABLE `servicios` ADD CONSTRAINT `fk_servicios_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE `servicios_fotos` ADD CONSTRAINT `fk_serv_fotos_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicios`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE `servicios_presentaciones` ADD CONSTRAINT `fk_serv_pres_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicios`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
