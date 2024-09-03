import { Module } from "@nestjs/common";
import { HelloController } from "./controller";

@Module({
  controllers: [HelloController],
})
export class HelloModule {}
