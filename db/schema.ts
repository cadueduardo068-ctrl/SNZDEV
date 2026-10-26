import {sqliteTable,text,integer,blob,primaryKey} from 'drizzle-orm/sqlite-core';
export const projects=sqliteTable('projects',{id:text('id').primaryKey(),name:text('name').notNull(),category:text('category').notNull(),description:text('description').notNull(),image:text('image').notNull(),url:text('url').notNull().default(''),tech:text('tech').notNull().default(''),demo:integer('demo',{mode:'boolean'}).notNull().default(true),featured:integer('featured',{mode:'boolean'}).notNull().default(false),position:integer('position').notNull().default(0),visible:integer('visible',{mode:'boolean'}).notNull().default(true),nature:text('nature').notNull().default('commercial'),stage:text('stage').notNull().default('review'),features:text('features').notNull().default(''),gallery:text('gallery').notNull().default(''),sourceUrl:text('source_url').notNull().default(''),segment:text('segment').notNull().default(''),artDirection:text('art_direction').notNull().default(''),palette:text('palette').notNull().default('')});
export const settings=sqliteTable('settings',{id:integer('id').primaryKey(),phone:text('phone').notNull(),instagram:text('instagram').notNull().default('')});
export const limits=sqliteTable('rate_limits',{key:text('key').primaryKey(),minute:integer('minute').notNull(),count:integer('count').notNull()});
export const mediaFiles=sqliteTable('media_files',{
  id:text('id').primaryKey(),contentType:text('content_type').notNull(),byteSize:integer('byte_size').notNull(),chunkCount:integer('chunk_count').notNull(),createdAt:integer('created_at').notNull(),
});
export const mediaChunks=sqliteTable('media_chunks',{
  fileId:text('file_id').notNull().references(()=>mediaFiles.id,{onDelete:'cascade'}),chunkIndex:integer('chunk_index').notNull(),data:blob('data',{mode:'buffer'}).notNull(),
},table=>[primaryKey({columns:[table.fileId,table.chunkIndex]})]);
