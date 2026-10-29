-- CreateTable
CREATE TABLE "AIDesign" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "garmentType" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "fabric" TEXT NOT NULL,
    "colour" TEXT NOT NULL,
    "occasion" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "designData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIDesign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIDesign_clientId_createdAt_idx" ON "AIDesign"("clientId", "createdAt");

-- AddForeignKey
ALTER TABLE "AIDesign" ADD CONSTRAINT "AIDesign_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
