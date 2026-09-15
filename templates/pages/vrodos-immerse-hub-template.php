<?php
$groups = VRodos_Immerse_Hub::catalog();
$profile_labels = [ 'desktop' => 'Desktop', 'headset' => 'VR headset', 'pc-rendered-vr' => 'PC-rendered VR' ];
$profile_icons = [ 'desktop' => 'monitor', 'headset' => 'glasses', 'pc-rendered-vr' => 'computer' ];
$mode_labels = [ 'single-player' => 'Single-player', 'networked' => 'Networked' ];
$mode_icons = [ 'single-player' => 'user-round', 'networked' => 'users-round' ];
?>
<!DOCTYPE html>
<html lang="en" data-theme="emerald">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Immerse Scenes</title>
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'vrodos-manager-wrapper vrodos-immerse-hub' ); ?>>
	<?php wp_body_open(); ?>
	<main class="immerse-hub-shell">
		<header class="immerse-hub-header">
			<div class="immerse-hub-brand"><span class="immerse-hub-brand-mark" aria-hidden="true"></span>Immerse</div>
			<h1>Scenes</h1>
		</header>

		<?php if ( ! $groups ) : ?>
			<div class="immerse-hub-empty">
				<i data-lucide="box" aria-hidden="true"></i>
				<h2>No built Immerse scenes yet</h2>
				<p>Scenes will appear here after they are built in VRodos.</p>
			</div>
		<?php else : ?>
			<?php foreach ( $groups as $group ) : ?>
				<section class="immerse-hub-project" aria-labelledby="immerse-project-<?php echo esc_attr( $group['id'] ); ?>">
					<div class="immerse-hub-project-heading">
						<h2 id="immerse-project-<?php echo esc_attr( $group['id'] ); ?>"><?php echo esc_html( $group['title'] ); ?></h2>
						<span><?php echo esc_html( count( $group['scenes'] ) ); ?> <?php echo count( $group['scenes'] ) === 1 ? 'scene' : 'scenes'; ?></span>
					</div>
					<div class="immerse-hub-grid">
						<?php foreach ( $group['scenes'] as $scene ) : ?>
							<?php $available = '' !== $scene['url']; ?>
							<?php if ( $available ) : ?>
								<a class="immerse-hub-card" href="<?php echo esc_url( $scene['url'] ); ?>" aria-label="Open <?php echo esc_attr( $scene['title'] ); ?>, <?php echo esc_attr( $profile_labels[ $scene['profile'] ] ); ?>, <?php echo esc_attr( $mode_labels[ $scene['mode'] ] ); ?>">
							<?php else : ?>
								<div class="immerse-hub-card is-unavailable">
							<?php endif; ?>
								<div class="immerse-hub-preview">
									<?php if ( $scene['preview'] ) : ?>
										<img src="<?php echo esc_url( $scene['preview'] ); ?>" alt="" loading="lazy">
									<?php else : ?>
										<div class="immerse-hub-placeholder"><i data-lucide="cuboid" aria-hidden="true"></i></div>
									<?php endif; ?>
									<div class="immerse-hub-badges">
										<span title="Build device: <?php echo esc_attr( $profile_labels[ $scene['profile'] ] ); ?>"><i data-lucide="<?php echo esc_attr( $profile_icons[ $scene['profile'] ] ); ?>" aria-hidden="true"></i><?php echo esc_html( $profile_labels[ $scene['profile'] ] ); ?></span>
										<span title="Build mode: <?php echo esc_attr( $mode_labels[ $scene['mode'] ] ); ?>"><i data-lucide="<?php echo esc_attr( $mode_icons[ $scene['mode'] ] ); ?>" aria-hidden="true"></i><?php echo esc_html( $mode_labels[ $scene['mode'] ] ); ?></span>
									</div>
								</div>
								<div class="immerse-hub-card-body">
									<h3><?php echo esc_html( $scene['title'] ); ?></h3>
									<?php if ( $available ) : ?>
										<span class="immerse-hub-enter">Enter scene <i data-lucide="arrow-up-right" aria-hidden="true"></i></span>
									<?php else : ?>
										<span class="immerse-hub-unavailable">Public runtime URL is not configured in VRodos Settings.</span>
									<?php endif; ?>
								</div>
							<?php if ( $available ) : ?></a><?php else : ?></div><?php endif; ?>
						<?php endforeach; ?>
					</div>
				</section>
			<?php endforeach; ?>
		<?php endif; ?>
	</main>
	<?php wp_footer(); ?>
</body>
</html>
