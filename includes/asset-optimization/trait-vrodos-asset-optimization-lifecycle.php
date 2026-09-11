<?php

/** Source activation/deletion hooks owned by the optimizer domain service. */
trait VRodos_Asset_Optimization_Lifecycle {
	public function handle_asset_glb_meta_change( $meta_id, int $asset_id, string $meta_key, $meta_value ): void {
		unset( $meta_id, $meta_value );

		if ( 'vrodos_asset3d_glb' !== $meta_key || get_post_type( $asset_id ) !== 'vrodos_asset3d' ) {
			return;
		}
		$previous_snapshot = self::read_source_snapshot( $asset_id );
		$previous_meta = get_post_meta( $asset_id, self::META_KEY, true );
		$source = self::prepare_source_glb( $asset_id );
		if ( is_wp_error( $source ) ) {
			return;
		}
		$content_changed = '' !== (string) ( $previous_snapshot['sha256'] ?? '' )
			&& (string) $previous_snapshot['sha256'] !== (string) ( $source['sha256'] ?? '' );
		$attachment_changed = absint( $previous_snapshot['attachmentId'] ?? 0 ) > 0
			&& absint( $previous_snapshot['attachmentId'] ?? 0 ) !== absint( $source['attachmentId'] ?? 0 );
		$legacy_records = is_array( $previous_meta ) && 2 !== absint( $previous_meta['schemaVersion'] ?? 0 );
		if ( $content_changed || $attachment_changed || $legacy_records ) {
			self::cancel_asset_optimization_jobs( $asset_id );
		}
		if ( $content_changed || $legacy_records ) {
			self::delete_asset_derivative_cache( $asset_id );
		}

		$analysis = self::refresh_asset_analysis( $asset_id );
		if ( ! is_wp_error( $analysis ) ) {
			$web_high = self::maybe_queue_web_high( $asset_id, $source, is_array( $analysis ) ? $analysis : [] );
			$decision = self::editor_preview_decision( (int) $source['sizeBytes'], is_array( $analysis ) ? $analysis : [] );
			if ( true !== $web_high && ! empty( $decision['shouldPreview'] ) ) {
				self::maybe_queue_editor_preview( $asset_id, $source, is_array( $analysis ) ? $analysis : [], $decision );
			}
		}
	}


	public function handle_asset_glb_meta_delete( $meta_ids, int $asset_id, string $meta_key, $meta_value ): void {
		unset( $meta_ids, $meta_value );

		if ( 'vrodos_asset3d_glb' !== $meta_key || get_post_type( $asset_id ) !== 'vrodos_asset3d' ) {
			return;
		}

		self::cancel_asset_optimization_jobs( $asset_id );
		self::delete_asset_derivative_cache( $asset_id );
		delete_post_meta( $asset_id, self::SOURCE_META_KEY );
	}


	public function handle_asset_delete( int $post_id, WP_Post $post ): void {
		if ( 'vrodos_asset3d' !== $post->post_type ) {
			return;
		}

		self::cancel_asset_optimization_jobs( $post_id );
		self::delete_asset_derivative_cache( $post_id );
		delete_post_meta( $post_id, self::SOURCE_META_KEY );
	}

}
