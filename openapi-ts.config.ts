import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi/openapi.yaml',
  output: './src/app/api/generated',
  plugins: ['@hey-api/client-angular', '@hey-api/sdk'],
});
