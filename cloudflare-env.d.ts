declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    DEPLOYMENT_TARGET?: string;
    ACCESS_TEAM_DOMAIN?: string;
    ACCESS_AUD?: string;
    ADMIN_EMAIL?: string;
    LEGACY_MEDIA_ORIGIN?: string;
    LEGACY_MEDIA_TOKEN?: string;
  }
}
